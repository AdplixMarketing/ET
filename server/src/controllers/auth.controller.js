import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import authConfig from '../config/auth.js';

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

export async function register(req, res, next) {
  try {
    const { email, password, business_name } = req.body;

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, business_name) VALUES ($1, $2, $3) RETURNING id, email, business_name, currency, plan',
      [email, hash, business_name || null]
    );

    const user = result.rows[0];
    await seedCategories(user.id);

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
      'SELECT id, email, password_hash, business_name, currency, plan FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.email);
    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT id, email, business_name, currency, plan, created_at FROM users WHERE id = $1',
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
    const { business_name, currency, email } = req.body;

    // If changing email, check it's not already taken
    if (email) {
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.userId]
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
        updated_at = NOW()
       WHERE id = $4 RETURNING id, email, business_name, currency, plan`,
      [email || null, business_name, currency, req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}
