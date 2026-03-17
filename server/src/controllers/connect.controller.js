import stripe from '../config/stripe.js';
import pool from '../config/db.js';
import { auditLog } from '../services/audit.service.js';

export async function createAccount(req, res, next) {
  try {
    const userResult = await pool.query(
      'SELECT email, stripe_connect_account_id FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    if (user.stripe_connect_account_id) {
      return res.json({ account_id: user.stripe_connect_account_id });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    });

    await pool.query(
      'UPDATE users SET stripe_connect_account_id = $1 WHERE id = $2',
      [account.id, req.userId]
    );

    res.json({ account_id: account.id });
  } catch (err) {
    console.error('Connect createAccount error:', err.message);
    next(err);
  }
}

export async function createOnboardingLink(req, res, next) {
  try {
    const userResult = await pool.query(
      'SELECT stripe_connect_account_id FROM users WHERE id = $1',
      [req.userId]
    );
    const accountId = userResult.rows[0]?.stripe_connect_account_id;

    if (!accountId) {
      return res.status(400).json({ error: 'Create a Connect account first' });
    }

    const clientUrl = process.env.CLIENT_URL || req.headers.origin;
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${clientUrl}/settings?connect_refresh=true`,
      return_url: `${clientUrl}/settings?connect_success=true`,
      type: 'account_onboarding',
    });

    res.json({ url: link.url });
  } catch (err) {
    console.error('Connect onboarding error:', err.message);
    next(err);
  }
}

export async function getStatus(req, res, next) {
  try {
    const userResult = await pool.query(
      'SELECT stripe_connect_account_id, stripe_connect_onboarded FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    if (!user.stripe_connect_account_id) {
      return res.json({ connected: false, onboarded: false });
    }

    // Check account status with Stripe
    const account = await stripe.accounts.retrieve(user.stripe_connect_account_id);
    const onboarded = account.charges_enabled && account.payouts_enabled;

    // Update our DB if onboarding completed
    if (onboarded && !user.stripe_connect_onboarded) {
      await pool.query(
        'UPDATE users SET stripe_connect_onboarded = TRUE WHERE id = $1',
        [req.userId]
      );
    }

    res.json({
      connected: true,
      onboarded,
      account_id: user.stripe_connect_account_id,
    });
  } catch (err) {
    next(err);
  }
}
