import pool from '../config/db.js';

export async function list(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM businesses WHERE user_id = $1 ORDER BY is_default DESC, name ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM businesses WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Business not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { name, currency, address, phone } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Business name required' });

    // Check if this is the user's first business
    const existing = await pool.query('SELECT COUNT(*) FROM businesses WHERE user_id = $1', [req.userId]);
    const isFirst = parseInt(existing.rows[0].count) === 0;

    const result = await pool.query(
      `INSERT INTO businesses (user_id, name, currency, address, phone, is_default)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, name.trim(), currency || 'USD', address || null, phone || null, isFirst]
    );

    // Set as default if first business
    if (isFirst) {
      await pool.query(
        'UPDATE users SET default_business_id = $1 WHERE id = $2',
        [result.rows[0].id, req.userId]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { name, currency, address, phone } = req.body;
    const result = await pool.query(
      `UPDATE businesses SET
        name = COALESCE($1, name), currency = COALESCE($2, currency),
        address = COALESCE($3, address), phone = COALESCE($4, phone),
        updated_at = NOW()
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [name, currency, address, phone, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Business not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function switchDefault(req, res, next) {
  try {
    // Verify ownership
    const biz = await pool.query(
      'SELECT id FROM businesses WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (biz.rows.length === 0) return res.status(404).json({ error: 'Business not found' });

    // Unset all defaults, set new one
    await pool.query('UPDATE businesses SET is_default = FALSE WHERE user_id = $1', [req.userId]);
    await pool.query('UPDATE businesses SET is_default = TRUE WHERE id = $1', [req.params.id]);
    await pool.query('UPDATE users SET default_business_id = $1 WHERE id = $2', [req.params.id, req.userId]);

    res.json({ message: 'Default business updated' });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM businesses WHERE id = $1 AND user_id = $2 AND is_default = FALSE RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Cannot delete default business. Switch default first.' });
    }
    res.json({ message: 'Business deleted' });
  } catch (err) {
    next(err);
  }
}
