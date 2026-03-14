import pool from '../config/db.js';

export async function list(req, res, next) {
  try {
    const {
      type, category_id, vendor_or_client, payment_method,
      date_from, date_to, amount_min, amount_max, q,
      page = 1, limit = 20, sort = 'date_desc'
    } = req.query;

    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;
    const params = [req.userId];
    let idx = 2;

    if (type) { query += ` AND t.type = $${idx++}`; params.push(type); }
    if (category_id) { query += ` AND t.category_id = $${idx++}`; params.push(category_id); }
    if (vendor_or_client) { query += ` AND t.vendor_or_client ILIKE $${idx++}`; params.push(`%${vendor_or_client}%`); }
    if (payment_method) { query += ` AND t.payment_method = $${idx++}`; params.push(payment_method); }
    if (date_from) { query += ` AND t.date >= $${idx++}`; params.push(date_from); }
    if (date_to) { query += ` AND t.date <= $${idx++}`; params.push(date_to); }
    if (amount_min) { query += ` AND t.amount >= $${idx++}`; params.push(amount_min); }
    if (amount_max) { query += ` AND t.amount <= $${idx++}`; params.push(amount_max); }
    if (q) {
      query += ` AND (t.description ILIKE $${idx} OR t.vendor_or_client ILIKE $${idx} OR t.notes ILIKE $${idx})`;
      params.push(`%${q}%`);
      idx++;
    }

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions t WHERE t.user_id = $1${query.split('WHERE t.user_id = $1')[1].split('ORDER')[0]}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const sortMap = {
      date_desc: 't.date DESC, t.created_at DESC',
      date_asc: 't.date ASC, t.created_at ASC',
      amount_desc: 't.amount DESC',
      amount_asc: 't.amount ASC',
    };
    query += ` ORDER BY ${sortMap[sort] || sortMap.date_desc}`;
    query += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, params);
    res.json({
      transactions: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name as category_name, c.color as category_color
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { type, amount, category_id, date, description, vendor_or_client, payment_method, notes, receipt_path: bodyReceiptPath } = req.body;
    const receipt_path = req.file ? req.file.path : (bodyReceiptPath || null);

    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, category_id, date, description, vendor_or_client, payment_method, notes, receipt_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.userId, type, amount, category_id || null, date, description || null, vendor_or_client || null, payment_method || null, notes || null, receipt_path]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { type, amount, category_id, date, description, vendor_or_client, payment_method, notes } = req.body;
    const receipt_path = req.file ? req.file.path : undefined;

    const fields = [];
    const params = [];
    let idx = 1;

    if (type !== undefined) { fields.push(`type = $${idx++}`); params.push(type); }
    if (amount !== undefined) { fields.push(`amount = $${idx++}`); params.push(amount); }
    if (category_id !== undefined) { fields.push(`category_id = $${idx++}`); params.push(category_id || null); }
    if (date !== undefined) { fields.push(`date = $${idx++}`); params.push(date); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); params.push(description); }
    if (vendor_or_client !== undefined) { fields.push(`vendor_or_client = $${idx++}`); params.push(vendor_or_client); }
    if (payment_method !== undefined) { fields.push(`payment_method = $${idx++}`); params.push(payment_method); }
    if (notes !== undefined) { fields.push(`notes = $${idx++}`); params.push(notes); }
    if (receipt_path !== undefined) { fields.push(`receipt_path = $${idx++}`); params.push(receipt_path); }

    fields.push(`updated_at = NOW()`);

    params.push(req.params.id, req.userId);
    const result = await pool.query(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx++} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
}
