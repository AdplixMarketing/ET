import pool from '../config/db.js';

export async function list(req, res, next) {
  try {
    const { q } = req.query;
    let query = `
      SELECT c.*,
        COALESCE(inv_stats.invoice_count, 0) as invoice_count,
        COALESCE(inv_stats.total_revenue, 0) + COALESCE(tx_stats.tx_revenue, 0) as total_revenue
      FROM clients c
      LEFT JOIN (
        SELECT client_id, COUNT(*) as invoice_count, SUM(total) as total_revenue
        FROM invoices WHERE user_id = $1 AND client_id IS NOT NULL
        GROUP BY client_id
      ) inv_stats ON c.id = inv_stats.client_id
      LEFT JOIN (
        SELECT client_id, SUM(amount) as tx_revenue
        FROM transactions WHERE user_id = $1 AND client_id IS NOT NULL AND type = 'income'
        GROUP BY client_id
      ) tx_stats ON c.id = tx_stats.client_id
      WHERE c.user_id = $1
    `;
    const params = [req.userId];

    if (q) {
      query += ` AND (c.name ILIKE $2 OR c.email ILIKE $2 OR c.company ILIKE $2)`;
      params.push(`%${q}%`);
    }

    query += ' ORDER BY c.name ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client not found' });

    const client = result.rows[0];

    // Parallel fetch invoices, transactions, and stats
    const [invoices, transactions, stats] = await Promise.all([
      pool.query(
        `SELECT id, invoice_number, status, total, issue_date, due_date, paid_date
         FROM invoices WHERE client_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
        [client.id, req.userId]
      ),
      pool.query(
        `SELECT t.id, t.type, t.amount, t.date, t.description, t.vendor_or_client, c.name as category_name
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.client_id = $1 AND t.user_id = $2 ORDER BY t.date DESC LIMIT 20`,
        [client.id, req.userId]
      ),
      pool.query(
        `SELECT
           COALESCE((SELECT SUM(total) FROM invoices WHERE client_id = $1 AND user_id = $2), 0)
           + COALESCE((SELECT SUM(amount) FROM transactions WHERE client_id = $1 AND user_id = $2 AND type = 'income'), 0) as total_revenue,
           (SELECT COUNT(*) FROM invoices WHERE client_id = $1 AND user_id = $2) as invoice_count`,
        [client.id, req.userId]
      ),
    ]);
    client.invoices = invoices.rows;
    client.transactions = transactions.rows;
    client.stats = stats.rows[0];

    res.json(client);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { name, email, phone, company, address, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Client name is required' });

    const result = await pool.query(
      `INSERT INTO clients (user_id, name, email, phone, company, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, name.trim(), email || null, phone || null, company || null, address || null, notes || null]
    );

    const newClient = result.rows[0];

    // Check for existing unlinked transactions that match this client's name
    const matchingTxs = await pool.query(
      `SELECT id, amount, date, type, description FROM transactions
       WHERE user_id = $1 AND client_id IS NULL AND vendor_or_client ILIKE $2
       ORDER BY date DESC`,
      [req.userId, newClient.name]
    );

    const response = { ...newClient };
    if (matchingTxs.rows.length > 0) {
      response.unlinked_transactions = matchingTxs.rows;
    }

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { name, email, phone, company, address, notes } = req.body;
    const result = await pool.query(
      `UPDATE clients SET
        name = COALESCE($1, name), email = COALESCE($2, email),
        phone = COALESCE($3, phone), company = COALESCE($4, company),
        address = COALESCE($5, address), notes = COALESCE($6, notes),
        updated_at = NOW()
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [name, email, phone, company, address, notes, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function linkTransactions(req, res, next) {
  try {
    const { transaction_ids } = req.body;
    if (!transaction_ids?.length) return res.status(400).json({ error: 'No transactions to link' });

    const result = await pool.query(
      `UPDATE transactions SET client_id = $1, updated_at = NOW()
       WHERE id = ANY($2::uuid[]) AND user_id = $3 AND client_id IS NULL
       RETURNING id`,
      [req.params.id, transaction_ids, req.userId]
    );
    res.json({ linked: result.rowCount });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Client deleted' });
  } catch (err) {
    next(err);
  }
}
