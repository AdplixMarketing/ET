import pool from '../config/db.js';

export async function list(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM recurring_rules WHERE user_id = $1 ORDER BY created_at DESC',
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
      'SELECT * FROM recurring_rules WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Recurring rule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { entity_type, frequency, next_run_date, end_date, transaction_template, invoice_template_data } = req.body;

    if (!entity_type || !frequency || !next_run_date) {
      return res.status(400).json({ error: 'entity_type, frequency, and next_run_date are required' });
    }

    const result = await pool.query(
      `INSERT INTO recurring_rules (user_id, entity_type, frequency, next_run_date, end_date, transaction_template, invoice_template_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.userId, entity_type, frequency, next_run_date, end_date || null, transaction_template || null, invoice_template_data || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { entity_type, frequency, next_run_date, end_date, transaction_template, invoice_template_data } = req.body;

    const result = await pool.query(
      `UPDATE recurring_rules
       SET entity_type = COALESCE($3, entity_type),
           frequency = COALESCE($4, frequency),
           next_run_date = COALESCE($5, next_run_date),
           end_date = $6,
           transaction_template = COALESCE($7, transaction_template),
           invoice_template_data = COALESCE($8, invoice_template_data),
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.userId, entity_type, frequency, next_run_date, end_date || null, transaction_template, invoice_template_data]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Recurring rule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function toggleActive(req, res, next) {
  try {
    const result = await pool.query(
      `UPDATE recurring_rules
       SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Recurring rule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM recurring_rules WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Recurring rule not found' });
    res.json({ message: 'Recurring rule deleted' });
  } catch (err) {
    next(err);
  }
}
