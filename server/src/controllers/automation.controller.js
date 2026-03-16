import pool from '../config/db.js';

export async function list(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT ar.*, c.name as category_name, c.color as category_color
       FROM automation_rules ar
       LEFT JOIN categories c ON ar.category_id = c.id
       WHERE ar.user_id = $1 ORDER BY ar.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { rule_type, name, match_field, match_value, match_type, category_id } = req.body;
    if (!name?.trim() || !match_value?.trim()) {
      return res.status(400).json({ error: 'Name and match value are required' });
    }

    const result = await pool.query(
      `INSERT INTO automation_rules (user_id, rule_type, name, match_field, match_value, match_type, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, rule_type || 'auto_categorize', name.trim(),
       match_field || 'vendor_or_client', match_value.trim(),
       match_type || 'contains', category_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { name, match_field, match_value, match_type, category_id, is_active } = req.body;
    const result = await pool.query(
      `UPDATE automation_rules SET
        name = COALESCE($1, name), match_field = COALESCE($2, match_field),
        match_value = COALESCE($3, match_value), match_type = COALESCE($4, match_type),
        category_id = COALESCE($5, category_id), is_active = COALESCE($6, is_active),
        updated_at = NOW()
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [name, match_field, match_value, match_type, category_id, is_active, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM automation_rules WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
    res.json({ message: 'Rule deleted' });
  } catch (err) {
    next(err);
  }
}
