import pool from '../config/db.js';

export async function list(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM invoice_templates WHERE user_id = $1 ORDER BY created_at DESC',
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
      'SELECT * FROM invoice_templates WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { name, primary_color, secondary_color, logo_url, layout, footer_text, custom_fields, hide_branding } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Template name required' });

    const result = await pool.query(
      `INSERT INTO invoice_templates (user_id, name, primary_color, secondary_color, logo_url, layout, footer_text, custom_fields, hide_branding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.userId, name.trim(), primary_color || '#4A90E2', secondary_color || '#1C1C1E',
       logo_url || null, layout || 'standard', footer_text || null,
       custom_fields ? JSON.stringify(custom_fields) : '[]', hide_branding || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { name, primary_color, secondary_color, logo_url, layout, footer_text, custom_fields, hide_branding } = req.body;
    const result = await pool.query(
      `UPDATE invoice_templates SET
        name = COALESCE($1, name), primary_color = COALESCE($2, primary_color),
        secondary_color = COALESCE($3, secondary_color), logo_url = COALESCE($4, logo_url),
        layout = COALESCE($5, layout), footer_text = COALESCE($6, footer_text),
        custom_fields = COALESCE($7, custom_fields), hide_branding = COALESCE($8, hide_branding),
        updated_at = NOW()
       WHERE id = $9 AND user_id = $10 RETURNING *`,
      [name, primary_color, secondary_color, logo_url, layout, footer_text,
       custom_fields ? JSON.stringify(custom_fields) : null, hide_branding,
       req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM invoice_templates WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
}
