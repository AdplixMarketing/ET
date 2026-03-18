import stripe, { PRICE_PRO_MONTHLY, PRICE_PRO_YEARLY, PRICE_MAX_MONTHLY, PRICE_MAX_YEARLY, getPlanFromPriceId } from '../config/stripe.js';
import pool from '../config/db.js';
import { auditLog } from '../services/audit.service.js';
import { sendEmail } from '../services/email.service.js';
import { welcomeEmailTemplate } from '../templates/welcomeEmail.js';
import { subscriptionReceiptTemplate } from '../templates/subscriptionReceiptEmail.js';

const PRICE_MAP = {
  'pro-monthly': PRICE_PRO_MONTHLY,
  'pro-yearly': PRICE_PRO_YEARLY,
  'max-monthly': PRICE_MAX_MONTHLY,
  'max-yearly': PRICE_MAX_YEARLY,
};

export async function createCheckout(req, res, next) {
  try {
    const { tier = 'pro', plan = 'monthly' } = req.body;
    const priceId = PRICE_MAP[`${tier}-${plan}`];

    if (!priceId) {
      return res.status(400).json({ error: 'Price not configured' });
    }

    const userResult = await pool.query(
      'SELECT email, stripe_customer_id FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    // Create or reuse Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, req.userId]
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin || process.env.CLIENT_URL}/settings?upgraded=true`,
      cancel_url: `${req.headers.origin || process.env.CLIENT_URL}/settings`,
      metadata: { userId: req.userId, tier },
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
}

export async function getSubscription(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT plan, stripe_subscription_id, plan_expires_at FROM users WHERE id = $1',
      [req.userId]
    );
    const user = result.rows[0];

    let subscription = null;
    if (user.stripe_subscription_id) {
      try {
        subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      } catch {
        // Subscription may have been deleted
      }
    }

    res.json({
      plan: user.plan,
      expires_at: user.plan_expires_at,
      subscription: subscription ? {
        status: subscription.status,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
      } : null,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelSubscription(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT stripe_subscription_id FROM users WHERE id = $1',
      [req.userId]
    );
    const subId = result.rows[0]?.stripe_subscription_id;

    if (!subId) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    // Cancel at end of billing period (don't cut off immediately)
    await stripe.subscriptions.update(subId, { cancel_at_period_end: true });

    res.json({ message: 'Subscription will cancel at end of billing period' });
  } catch (err) {
    next(err);
  }
}

// Stripe webhook handler (called by Stripe, not by the user)
export async function webhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const subscriptionId = session.subscription;

      // Determine plan from the subscription's price
      let plan = session.metadata.tier || 'pro';
      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price?.id;
          if (priceId) {
            plan = getPlanFromPriceId(priceId);
          }
          await pool.query(
            `UPDATE users SET plan = $1, stripe_subscription_id = $2,
             stripe_customer_id = $3, stripe_price_id = $4, plan_expires_at = NULL, updated_at = NOW()
             WHERE id = $5`,
            [plan, subscriptionId, session.customer, priceId, userId]
          );
        } catch {
          await pool.query(
            `UPDATE users SET plan = $1, stripe_subscription_id = $2,
             stripe_customer_id = $3, plan_expires_at = NULL, updated_at = NOW()
             WHERE id = $4`,
            [plan, subscriptionId, session.customer, userId]
          );
        }
      }

      await auditLog(userId, 'plan_change', { metadata: { plan, trigger: 'checkout' } });

      // Send welcome email
      try {
        const welcomeUser = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
        if (welcomeUser.rows[0]) {
          const planName = plan === 'max' ? 'AddFi Max' : 'AddFi Pro';
          await sendEmail({
            to: welcomeUser.rows[0].email,
            subject: `Welcome to ${planName}!`,
            html: welcomeEmailTemplate(planName),
          });
        }
      } catch (emailErr) {
        console.error('Failed to send welcome email:', emailErr.message);
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      // Determine plan from price
      const priceId = invoice.lines?.data?.[0]?.price?.id;
      const plan = priceId ? getPlanFromPriceId(priceId) : 'pro';

      // Extend plan on each successful payment
      await pool.query(
        `UPDATE users SET plan = $1, plan_expires_at = NULL, updated_at = NOW()
         WHERE stripe_customer_id = $2`,
        [plan, customerId]
      );

      // Find user for audit log
      const paidUser = await pool.query('SELECT id FROM users WHERE stripe_customer_id = $1', [customerId]);
      if (paidUser.rows[0]) {
        await auditLog(paidUser.rows[0].id, 'payment_received', { metadata: { amount: invoice.amount_paid } });

        // Send receipt email for recurring payments
        try {
          const receiptUser = await pool.query('SELECT email, plan FROM users WHERE id = $1', [paidUser.rows[0].id]);
          if (receiptUser.rows[0] && invoice.billing_reason === 'subscription_cycle') {
            const periodEnd = invoice.lines?.data?.[0]?.period?.end;
            const planName = receiptUser.rows[0].plan === 'max' ? 'AddFi Max' : 'AddFi Pro';
            await sendEmail({
              to: receiptUser.rows[0].email,
              subject: 'AddFi Payment Confirmation',
              html: subscriptionReceiptTemplate({
                amount: invoice.amount_paid,
                planName,
                date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                periodEnd: periodEnd ? new Date(periodEnd * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A',
              }),
            });
          }
        } catch (emailErr) {
          console.error('Failed to send receipt email:', emailErr.message);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;

      const deletedSubUser = await pool.query('SELECT id FROM users WHERE stripe_subscription_id = $1', [subscription.id]);
      await pool.query(
        `UPDATE users SET plan = 'free', stripe_subscription_id = NULL, stripe_price_id = NULL,
         plan_expires_at = NOW(), updated_at = NOW()
         WHERE stripe_subscription_id = $1`,
        [subscription.id]
      );
      if (deletedSubUser.rows[0]) {
        await auditLog(deletedSubUser.rows[0].id, 'plan_change', { metadata: { plan: 'free', trigger: 'subscription_deleted' } });
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const invoiceId = paymentIntent.metadata?.invoice_id;

      if (invoiceId) {
        // Portal payment — mark invoice as paid
        await pool.query(
          `UPDATE invoices SET status = 'paid', stripe_payment_intent_id = $1, updated_at = NOW()
           WHERE id = $2 AND status IN ('sent', 'overdue')`,
          [paymentIntent.id, invoiceId]
        );

        // Find owner for audit log
        const inv = await pool.query('SELECT user_id FROM invoices WHERE id = $1', [invoiceId]);
        if (inv.rows[0]) {
          await auditLog(inv.rows[0].user_id, 'invoice_paid', {
            entityType: 'invoice',
            entityId: invoiceId,
            metadata: { amount: paymentIntent.amount, payment_intent: paymentIntent.id },
          });
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.warn('Payment failed for customer:', invoice.customer);
      // Stripe will retry automatically. After final failure, subscription.deleted fires.
      break;
    }
  }

  res.json({ received: true });
}
