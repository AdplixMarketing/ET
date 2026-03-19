import pool from '../config/db.js';

export async function list(req, res, next) {
  try {
    const { status, from, to, client_id } = req.query;
    let query = `
      SELECT j.*, c.name as client_name, c.phone as client_phone, c.address as client_address
      FROM jobs j
      LEFT JOIN clients c ON j.client_id = c.id
      WHERE j.user_id = $1
    `;
    const params = [req.userId];
    let idx = 2;

    if (status) {
      query += ` AND j.status = $${idx}`;
      params.push(status);
      idx++;
    }
    if (from) {
      query += ` AND j.scheduled_date >= $${idx}`;
      params.push(from);
      idx++;
    }
    if (to) {
      query += ` AND j.scheduled_date <= $${idx}`;
      params.push(to);
      idx++;
    }
    if (client_id) {
      query += ` AND j.client_id = $${idx}`;
      params.push(client_id);
      idx++;
    }

    query += ' ORDER BY j.scheduled_date ASC, j.scheduled_time ASC NULLS LAST';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT j.*, c.name as client_name, c.email as client_email,
              c.phone as client_phone, c.address as client_address
       FROM jobs j
       LEFT JOIN clients c ON j.client_id = c.id
       WHERE j.id = $1 AND j.user_id = $2`,
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { title, description, client_id, scheduled_date, scheduled_time, end_time, location, notes } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Job title is required' });
    if (!scheduled_date) return res.status(400).json({ error: 'Scheduled date is required' });

    const result = await pool.query(
      `INSERT INTO jobs (user_id, title, description, client_id, scheduled_date, scheduled_time, end_time, location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.userId, title.trim(), description || null, client_id || null,
       scheduled_date, scheduled_time || null, end_time || null, location || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { title, description, client_id, scheduled_date, scheduled_time, end_time, location, notes, status, invoice_id } = req.body;
    const result = await pool.query(
      `UPDATE jobs SET
        title = COALESCE($1, title), description = COALESCE($2, description),
        client_id = $3, scheduled_date = COALESCE($4, scheduled_date),
        scheduled_time = $5, end_time = $6,
        location = COALESCE($7, location), notes = COALESCE($8, notes),
        status = COALESCE($9, status), invoice_id = COALESCE($10, invoice_id),
        updated_at = NOW()
       WHERE id = $11 AND user_id = $12 RETURNING *`,
      [title, description, client_id || null, scheduled_date,
       scheduled_time || null, end_time || null, location, notes,
       status, invoice_id, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    next(err);
  }
}
