import pool from '../config/db.js';
import { auditLog } from '../services/audit.service.js';

export async function exportData(req, res, next) {
  try {
    const userId = req.userId;

    const [userResult, categoriesResult, transactionsResult, invoicesResult] = await Promise.all([
      pool.query(
        'SELECT id, email, business_name, currency, plan, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      ),
      pool.query('SELECT id, name, type, color, is_default, created_at FROM categories WHERE user_id = $1', [userId]),
      pool.query(
        `SELECT id, type, amount, date, description, vendor_or_client, payment_method, notes, created_at, updated_at
         FROM transactions WHERE user_id = $1 ORDER BY date DESC`,
        [userId]
      ),
      pool.query(
        `SELECT id, invoice_number, status, client_name, client_email, issue_date, due_date, notes,
                subtotal, tax_rate, tax_amount, total, paid_date, created_at, updated_at
         FROM invoices WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      ),
    ]);

    // Get invoice items for each invoice
    const invoices = invoicesResult.rows;
    for (const inv of invoices) {
      const items = await pool.query(
        'SELECT description, quantity, rate, amount, sort_order FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order',
        [inv.id]
      );
      inv.items = items.rows;
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      user: userResult.rows[0],
      categories: categoriesResult.rows,
      transactions: transactionsResult.rows,
      invoices,
    };

    await auditLog(userId, 'data_export', { req });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=addfi-data-export.json');
    res.json(exportData);
  } catch (err) {
    next(err);
  }
}
