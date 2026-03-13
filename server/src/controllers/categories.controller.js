import pool from '../config/db.js';

export async function list(req, res, next) {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM categories WHERE user_id = $1';
    const params = [req.userId];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }
    query += ' ORDER BY is_default DESC, name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { name, type, color } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (user_id, name, type, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, name, type, color || '#4A90E2']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { name, color } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name = COALESCE($1, name), color = COALESCE($2, color) WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, color, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const txCheck = await pool.query(
      'SELECT COUNT(*) FROM transactions WHERE category_id = $1',
      [req.params.id]
    );
    if (parseInt(txCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing transactions. Reassign them first.' });
    }

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}
