import crypto from 'crypto';
import stripe from '../config/stripe.js';
import pool from '../config/db.js';
import { auditLog } from '../services/audit.service.js';

const PROCESSING_FEE_RATE = 0.035; // 3.5%

export async function getInvoice(req, res, next) {
  try {
    const { token } = req.params;
    const result = await pool.query(
      `SELECT i.*, u.business_name, u.email as business_email, u.business_address, u.business_phone,
              u.stripe_connect_account_id, u.stripe_connect_onboarded
       FROM invoices i
       JOIN users u ON i.user_id = u.id
       WHERE i.portal_token = $1 AND i.portal_expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found or link expired' });
    }

    const invoice = result.rows[0];

    // Get items
    const items = await pool.query(
      'SELECT description, quantity, rate, amount, sort_order FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order',
      [invoice.id]
    );
    invoice.items = items.rows;

    // Calculate processing fee
    const processingFee = invoice.portal_payment_enabled
      ? (parseFloat(invoice.total) * PROCESSING_FEE_RATE).toFixed(2)
      : 0;

    // Don't expose sensitive fields
    const { user_id, stripe_connect_account_id, stripe_connect_onboarded, ...safeInvoice } = invoice;

    res.json({
      ...safeInvoice,
      processing_fee: parseFloat(processingFee),
      payment_enabled: invoice.portal_payment_enabled && invoice.stripe_connect_onboarded && invoice.status !== 'paid',
    });
  } catch (err) {
    next(err);
  }
}

export async function createPayment(req, res, next) {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT i.*, u.stripe_connect_account_id, u.stripe_connect_onboarded, u.id as owner_id
       FROM invoices i
       JOIN users u ON i.user_id = u.id
       WHERE i.portal_token = $1 AND i.portal_expires_at > NOW()
       AND i.status IN ('sent', 'overdue') AND i.portal_payment_enabled = TRUE`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found or cannot be paid' });
    }

    const invoice = result.rows[0];

    if (!invoice.stripe_connect_account_id || !invoice.stripe_connect_onboarded) {
      return res.status(400).json({ error: 'Payment not available for this invoice' });
    }

    // Server-side amount calculation (never trust client)
    const invoiceTotal = parseFloat(invoice.total);
    const processingFee = parseFloat((invoiceTotal * PROCESSING_FEE_RATE).toFixed(2));
    const chargeAmount = Math.round((invoiceTotal + processingFee) * 100); // Convert to cents

    // Platform fee = total charge minus the amount going to the connected account
    // Stripe takes 2.9% + $0.30, platform keeps the rest of the 3.5%
    const applicationFeeAmount = Math.round(processingFee * 100);

    // Generate idempotency key
    const idempotencyKey = `portal-${invoice.id}-${Date.now()}`;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: 'usd',
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: invoice.stripe_connect_account_id,
      },
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        portal_token: token,
      },
    }, {
      idempotencyKey,
    });

    // Store payment intent ID
    await pool.query(
      'UPDATE invoices SET stripe_payment_intent_id = $1, processing_fee = $2 WHERE id = $3',
      [paymentIntent.id, processingFee, invoice.id]
    );

    await auditLog(invoice.owner_id, 'payment_attempt', {
      entityType: 'invoice',
      entityId: invoice.id,
      req,
      metadata: { amount: chargeAmount, processing_fee: processingFee },
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      amount: chargeAmount,
      processing_fee: processingFee,
    });
  } catch (err) {
    next(err);
  }
}
