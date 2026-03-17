import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import authConfig from '../config/auth.js';
import { auditLog } from '../services/audit.service.js';
import { sendEmail } from '../services/email.service.js';
import { verifyEmailTemplate } from '../templates/verifyEmail.js';
import { resetPasswordTemplate } from '../templates/resetPasswordEmail.js';

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Fuel', color: '#FF6B6B' },
  { name: 'Supplies', color: '#51CF66' },
  { name: 'Marketing', color: '#20C997' },
  { name: 'Software', color: '#4DABF7' },
  { name: 'Equipment', color: '#845EF7' },
  { name: 'Meals', color: '#FFA94D' },
  { name: 'Travel', color: '#339AF0' },
  { name: 'Office', color: '#F06595' },
  { name: 'Utilities', color: '#FF922B' },
  { name: 'Miscellaneous', color: '#868E96' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Client Payment', color: '#34C759' },
  { name: 'Service Revenue', color: '#4A90E2' },
  { name: 'Product Sales', color: '#FCC419' },
  { name: 'Refunds', color: '#FF922B' },
  { name: 'Other Income', color: '#868E96' },
];

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MINUTES = 15;

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function generateToken(userId, email) {
  return jwt.sign({ userId, email }, authConfig.secret, {
    expiresIn: authConfig.expiresIn,
  });
}

async function seedCategories(userId) {
  const values = [];
  const params = [];
  let idx = 1;

  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    values.push(`($${idx++}, $${idx++}, 'expense', $${idx++}, TRUE)`);
    params.push(userId, cat.name, cat.color);
  }
  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    values.push(`($${idx++}, $${idx++}, 'income', $${idx++}, TRUE)`);
    params.push(userId, cat.name, cat.color);
  }

  await pool.query(
    `INSERT INTO categories (user_id, name, type, color, is_default) VALUES ${values.join(', ')}`,
    params
  );
}

function sanitizeUser(user) {
  const { password_hash, reset_token, reset_token_expires, email_verify_token, email_verify_expires, stripe_customer_id, stripe_subscription_id, failed_login_attempts, locked_until, ...safe } = user;
  return safe;
}

export async function register(req, res, next) {
  try {
    const { email, password, business_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters with uppercase, lowercase, and a number',
      });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, business_name, email_verify_token, email_verify_expires)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, business_name, currency, plan, email_verified`,
      [email.toLowerCase().trim(), hash, business_name || null, verifyToken, verifyExpires]
    );

    const user = result.rows[0];
    await seedCategories(user.id);

    await auditLog(user.id, 'register', { req });

    // Send verification email
    const clientUrl = process.env.CLIENT_URL || req.headers.origin || 'http://localhost:5173';
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your AddFi email',
        html: verifyEmailTemplate(`${clientUrl}/verify-email?token=${verifyToken}`),
      });
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
    }

    const token = generateToken(user.id, user.email);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT id, email, password_hash, business_name, currency, plan,
              failed_login_attempts, locked_until, email_verified
       FROM users WHERE email = $1`,
      [email?.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      await auditLog(user.id, 'failed_login', { req, metadata: { reason: 'account_locked' } });
      return res.status(423).json({
        error: `Account locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      const updates = { failed_login_attempts: attempts };

      if (attempts >= LOCKOUT_THRESHOLD) {
        updates.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        await pool.query(
          'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
          [attempts, updates.locked_until, user.id]
        );
      } else {
        await pool.query(
          'UPDATE users SET failed_login_attempts = $1 WHERE id = $2',
          [attempts, user.id]
        );
      }

      await auditLog(user.id, 'failed_login', { req, metadata: { attempts } });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Reset failed attempts on successful login
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
      [user.id]
    );

    await auditLog(user.id, 'login', { req });

    const token = generateToken(user.id, user.email);
    const userData = sanitizeUser(user);
    res.json({ token, user: userData });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, email, business_name, currency, plan, email_verified,
              business_logo, business_address, business_phone,
              stripe_connect_onboarded, default_business_id, created_at
       FROM users WHERE id = $1`,
      [req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const { business_name, currency, email, business_address, business_phone } = req.body;

    // If changing email, check it's not already taken
    if (email) {
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase().trim(), req.userId]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const result = await pool.query(
      `UPDATE users SET
        email = COALESCE($1, email),
        business_name = COALESCE($2, business_name),
        currency = COALESCE($3, currency),
        business_address = COALESCE($4, business_address),
        business_phone = COALESCE($5, business_phone),
        updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, business_name, currency, plan, email_verified,
                 business_logo, business_address, business_phone,
                 stripe_connect_onboarded, default_business_id`,
      [email?.toLowerCase().trim() || null, business_name, currency, business_address, business_phone, req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const result = await pool.query(
      `UPDATE users SET email_verified = TRUE, email_verify_token = NULL, email_verify_expires = NULL, updated_at = NOW()
       WHERE email_verify_token = $1 AND email_verify_expires > NOW()
       RETURNING id, email`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }

    await auditLog(result.rows[0].id, 'email_verified', { req });
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);

    // Always respond success (don't reveal if email exists)
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, result.rows[0].id]
    );

    // Send reset email
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    try {
      await sendEmail({
        to: email.toLowerCase().trim(),
        subject: 'Reset your AddFi password',
        html: resetPasswordTemplate(`${clientUrl}/reset-password?token=${resetToken}`),
      });
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr.message);
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters with uppercase, lowercase, and a number',
      });
    }

    const result = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL,
       failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = $2`,
      [hash, result.rows[0].id]
    );

    await auditLog(result.rows[0].id, 'password_change', { req, metadata: { method: 'reset' } });
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}
