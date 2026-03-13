import pool from '../config/db.js';
import { generatePDF } from '../services/report.service.js';

export async function pnl(req, res, next) {
  try {
    const { from, to, period = 'monthly' } = req.query;
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const defaultTo = now.toISOString().slice(0, 10);

    const dateFrom = from || defaultFrom;
    const dateTo = to || defaultTo;

    const result = await pool.query(
      `SELECT t.type, c.name as category, c.color,
              COALESCE(SUM(t.amount), 0) as total, COUNT(*) as count
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.date >= $2 AND t.date <= $3
       GROUP BY t.type, c.name, c.color
       ORDER BY t.type, total DESC`,
      [req.userId, dateFrom, dateTo]
    );

    const income = result.rows.filter(r => r.type === 'income');
    const expenses = result.rows.filter(r => r.type === 'expense');
    const totalIncome = income.reduce((s, r) => s + parseFloat(r.total), 0);
    const totalExpenses = expenses.reduce((s, r) => s + parseFloat(r.total), 0);

    res.json({
      period: { from: dateFrom, to: dateTo },
      income: { categories: income, total: totalIncome },
      expenses: { categories: expenses, total: totalExpenses },
      netProfit: totalIncome - totalExpenses,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportCSV(req, res, next) {
  try {
    const { from, to, type } = req.query;
    let query = `
      SELECT t.type, t.amount, t.date, t.description, t.vendor_or_client,
             t.payment_method, t.notes, c.name as category
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;
    const params = [req.userId];
    let idx = 2;

    if (from) { query += ` AND t.date >= $${idx++}`; params.push(from); }
    if (to) { query += ` AND t.date <= $${idx++}`; params.push(to); }
    if (type) { query += ` AND t.type = $${idx++}`; params.push(type); }
    query += ' ORDER BY t.date DESC';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No transactions found for export' });
    }

    const headers = ['Type', 'Amount', 'Date', 'Category', 'Description', 'Vendor/Client', 'Payment Method', 'Notes'];
    const csvRows = [headers.join(',')];
    for (const row of result.rows) {
      csvRows.push([
        row.type,
        row.amount,
        row.date,
        `"${(row.category || '').replace(/"/g, '""')}"`,
        `"${(row.description || '').replace(/"/g, '""')}"`,
        `"${(row.vendor_or_client || '').replace(/"/g, '""')}"`,
        row.payment_method || '',
        `"${(row.notes || '').replace(/"/g, '""')}"`,
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csvRows.join('\n'));
  } catch (err) {
    next(err);
  }
}

export async function exportPDF(req, res, next) {
  try {
    const { from, to } = req.query;
    const now = new Date();
    const dateFrom = from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const dateTo = to || now.toISOString().slice(0, 10);

    // Get user info
    const userResult = await pool.query('SELECT business_name, currency FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];

    // Get P&L data
    const result = await pool.query(
      `SELECT t.type, c.name as category, COALESCE(SUM(t.amount), 0) as total
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.date >= $2 AND t.date <= $3
       GROUP BY t.type, c.name ORDER BY t.type, total DESC`,
      [req.userId, dateFrom, dateTo]
    );

    const income = result.rows.filter(r => r.type === 'income');
    const expenses = result.rows.filter(r => r.type === 'expense');
    const totalIncome = income.reduce((s, r) => s + parseFloat(r.total), 0);
    const totalExpenses = expenses.reduce((s, r) => s + parseFloat(r.total), 0);

    const pdfBuffer = await generatePDF({
      businessName: user.business_name || 'My Business',
      currency: user.currency || 'USD',
      dateFrom,
      dateTo,
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=profit-loss-report.pdf');
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}
