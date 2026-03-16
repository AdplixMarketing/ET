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

    // Batch-fetch all invoice items in one query
    const invoices = invoicesResult.rows;
    if (invoices.length > 0) {
      const invoiceIds = invoices.map((inv) => inv.id);
      const allItems = await pool.query(
        'SELECT invoice_id, description, quantity, rate, amount, sort_order FROM invoice_items WHERE invoice_id = ANY($1) ORDER BY invoice_id, sort_order',
        [invoiceIds]
      );
      const itemsByInvoice = {};
      for (const item of allItems.rows) {
        if (!itemsByInvoice[item.invoice_id]) itemsByInvoice[item.invoice_id] = [];
        itemsByInvoice[item.invoice_id].push(item);
      }
      for (const inv of invoices) {
        inv.items = itemsByInvoice[inv.id] || [];
      }
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
