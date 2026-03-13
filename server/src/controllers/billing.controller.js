import stripe, { PRICE_MONTHLY, PRICE_YEARLY } from '../config/stripe.js';
import pool from '../config/db.js';

export async function createCheckout(req, res, next) {
  try {
    const { plan = 'monthly' } = req.body;
    const priceId = plan === 'yearly' ? PRICE_YEARLY : PRICE_MONTHLY;

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
      metadata: { userId: req.userId },
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
        current_period_end: new Date(subscription.current_period_end * 1000),
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

      await pool.query(
        `UPDATE users SET plan = 'pro', stripe_subscription_id = $1,
         stripe_customer_id = $2, plan_expires_at = NULL, updated_at = NOW()
         WHERE id = $3`,
        [subscriptionId, session.customer, userId]
      );
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      // Extend plan on each successful payment
      await pool.query(
        `UPDATE users SET plan = 'pro', plan_expires_at = NULL, updated_at = NOW()
         WHERE stripe_customer_id = $1`,
        [customerId]
      );
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;

      await pool.query(
        `UPDATE users SET plan = 'free', stripe_subscription_id = NULL,
         plan_expires_at = NOW(), updated_at = NOW()
         WHERE stripe_subscription_id = $1`,
        [subscription.id]
      );
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
