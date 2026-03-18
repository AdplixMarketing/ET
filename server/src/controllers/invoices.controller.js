import crypto from 'crypto';
import pool from '../config/db.js';
import { generateInvoicePDF } from '../services/invoice.service.js';
import { sendEmail } from '../services/email.service.js';
import { invoiceEmailTemplate } from '../templates/invoiceEmail.js';
import { auditLog } from '../services/audit.service.js';
import { getUserPlan, FREE_LIMITS, PRO_LIMITS } from '../middleware/planGate.js';

async function getNextInvoiceNumber(userId) {
  const result = await pool.query(
    `SELECT invoice_number FROM invoices WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  if (result.rows.length === 0) return 'INV-001';
  const last = result.rows[0].invoice_number;
  const num = parseInt(last.split('-')[1]) + 1;
  return `INV-${String(num).padStart(3, '0')}`;
}

export async function list(req, res, next) {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM invoices WHERE user_id = $1';
    const params = [req.userId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    // Batch-fetch all items in one query instead of N+1
    if (result.rows.length > 0) {
      const invoiceIds = result.rows.map((inv) => inv.id);
      const itemsResult = await pool.query(
        `SELECT * FROM invoice_items WHERE invoice_id = ANY($1) ORDER BY invoice_id, sort_order`,
        [invoiceIds]
      );
      const itemsByInvoice = {};
      for (const item of itemsResult.rows) {
        if (!itemsByInvoice[item.invoice_id]) itemsByInvoice[item.invoice_id] = [];
        itemsByInvoice[item.invoice_id].push(item);
      }
      for (const invoice of result.rows) {
        invoice.items = itemsByInvoice[invoice.id] || [];
      }
    }

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });

    const invoice = result.rows[0];
    const [itemsResult] = await Promise.all([
      pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order', [invoice.id]),
    ]);
    invoice.items = itemsResult.rows;

    res.json(invoice);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { client_name, client_email, client_id, due_date, notes, tax_rate = 0, items = [] } = req.body;
    const invoice_number = await getNextInvoiceNumber(req.userId);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const tax_amount = subtotal * (tax_rate / 100);
    const total = subtotal + tax_amount;

    // If client_id provided, auto-populate name/email from client record
    let finalClientName = client_name;
    let finalClientEmail = client_email;
    if (client_id) {
      const clientResult = await client.query(
        'SELECT name, email FROM clients WHERE id = $1 AND user_id = $2',
        [client_id, req.userId]
      );
      if (clientResult.rows.length > 0) {
        finalClientName = finalClientName || clientResult.rows[0].name;
        finalClientEmail = finalClientEmail || clientResult.rows[0].email;
      }
    }

    const invoiceResult = await client.query(
      `INSERT INTO invoices (user_id, invoice_number, client_name, client_email, client_id, due_date, notes, subtotal, tax_rate, tax_amount, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [req.userId, invoice_number, finalClientName, finalClientEmail || null, client_id || null, due_date, notes || null, subtotal, tax_rate, tax_amount, total]
    );
    const invoice = invoiceResult.rows[0];

    // Insert line items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const amount = item.quantity * item.rate;
      await client.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [invoice.id, item.description, item.quantity, item.rate, amount, i]
      );
    }

    await client.query('COMMIT');

    // Fetch complete invoice
    const itemsResult = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order',
      [invoice.id]
    );
    invoice.items = itemsResult.rows;

    res.status(201).json(invoice);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function update(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { client_name, client_email, due_date, notes, tax_rate, items } = req.body;

    // Check invoice exists and is still draft
    const existing = await client.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const currentTaxRate = tax_rate !== undefined ? tax_rate : existing.rows[0].tax_rate;

    if (items) {
      // Recalculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      const tax_amount = subtotal * (currentTaxRate / 100);
      const total = subtotal + tax_amount;

      await client.query(
        `UPDATE invoices SET client_name = COALESCE($1, client_name), client_email = COALESCE($2, client_email),
         due_date = COALESCE($3, due_date), notes = COALESCE($4, notes), tax_rate = $5,
         subtotal = $6, tax_amount = $7, total = $8, updated_at = NOW()
         WHERE id = $9`,
        [client_name, client_email, due_date, notes, currentTaxRate, subtotal, tax_amount, total, req.params.id]
      );

      // Replace items
      await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const amount = item.quantity * item.rate;
        await client.query(
          `INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [req.params.id, item.description, item.quantity, item.rate, amount, i]
        );
      }
    } else {
      await client.query(
        `UPDATE invoices SET client_name = COALESCE($1, client_name), client_email = COALESCE($2, client_email),
         due_date = COALESCE($3, due_date), notes = COALESCE($4, notes), updated_at = NOW()
         WHERE id = $5`,
        [client_name, client_email, due_date, notes, req.params.id]
      );
    }

    await client.query('COMMIT');

    // Return updated invoice
    const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    const invoice = result.rows[0];
    const itemsResult = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order',
      [invoice.id]
    );
    invoice.items = itemsResult.rows;

    res.json(invoice);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function markSent(req, res, next) {
  try {
    const invoiceResult = await pool.query(
      `SELECT * FROM invoices WHERE id = $1 AND user_id = $2 AND status = 'draft'`,
      [req.params.id, req.userId]
    );
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found or already sent' });
    }

    const invoice = invoiceResult.rows[0];

    // Get user info for PDF and email
    const userResult = await pool.query(
      'SELECT business_name, email, currency FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    // If client has email, send the invoice
    if (invoice.client_email) {
      const items = await pool.query(
        'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order',
        [invoice.id]
      );
      invoice.items = items.rows;

      const pdfBuffer = await generateInvoicePDF(invoice, user);

      await sendEmail({
        to: invoice.client_email,
        subject: `Invoice ${invoice.invoice_number} from ${user.business_name || 'AddFi'}`,
        html: invoiceEmailTemplate({
          invoiceNumber: invoice.invoice_number,
          clientName: invoice.client_name,
          businessName: user.business_name || 'My Business',
          total: invoice.total,
          dueDate: invoice.due_date,
          currency: user.currency,
        }),
        attachments: [{
          content: pdfBuffer.toString('base64'),
          filename: `${invoice.invoice_number}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        }],
      });
    }

    // Generate portal token for online viewing/payment
    const portalToken = crypto.randomBytes(32).toString('hex');
    const portalExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Mark as sent
    const result = await pool.query(
      `UPDATE invoices SET status = 'sent', portal_token = $1, portal_expires_at = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [portalToken, portalExpires, req.params.id]
    );

    await auditLog(req.userId, 'invoice_sent', {
      entityType: 'invoice',
      entityId: invoice.id,
      req,
      metadata: { invoice_number: invoice.invoice_number, client_email: invoice.client_email },
    });

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function markPaid(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const invoiceResult = await client.query(
      `SELECT * FROM invoices WHERE id = $1 AND user_id = $2 AND status IN ('sent', 'overdue')`,
      [req.params.id, req.userId]
    );
    if (invoiceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invoice not found or cannot be marked paid' });
    }

    const invoice = invoiceResult.rows[0];
    const paidDate = req.body.paid_date || new Date().toISOString().slice(0, 10);

    // Check transaction limit before creating the income transaction
    const plan = await getUserPlan(req.userId, req);
    if (plan !== 'max') {
      const limits = plan === 'pro' ? PRO_LIMITS : FREE_LIMITS;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const countResult = await client.query(
        'SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND created_at >= $2',
        [req.userId, startOfMonth]
      );
      if (parseInt(countResult.rows[0].count) >= limits.transactions_per_month) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          error: `Transaction limit reached (${limits.transactions_per_month}/month). Upgrade for more.`,
          upgrade: true,
        });
      }
    }

    // Find the "Client Payment" income category for this user
    const catResult = await client.query(
      `SELECT id FROM categories WHERE user_id = $1 AND type = 'income' AND name = 'Client Payment' LIMIT 1`,
      [req.userId]
    );
    const categoryId = catResult.rows[0]?.id || null;

    // Auto-create income transaction
    const txResult = await client.query(
      `INSERT INTO transactions (user_id, type, amount, category_id, date, description, vendor_or_client, payment_method, notes)
       VALUES ($1, 'income', $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        req.userId,
        invoice.total,
        categoryId,
        paidDate,
        `Invoice ${invoice.invoice_number}`,
        invoice.client_name,
        req.body.payment_method || null,
        `Payment for invoice ${invoice.invoice_number}`,
      ]
    );

    // Update invoice status
    await client.query(
      `UPDATE invoices SET status = 'paid', paid_date = $1, transaction_id = $2, updated_at = NOW()
       WHERE id = $3`,
      [paidDate, txResult.rows[0].id, req.params.id]
    );

    await client.query('COMMIT');

    await auditLog(req.userId, 'invoice_paid', {
      entityType: 'invoice',
      entityId: req.params.id,
      req,
      metadata: { invoice_number: invoice.invoice_number, amount: invoice.total },
    });

    res.json({
      message: 'Invoice marked as paid',
      transaction_id: txResult.rows[0].id,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function downloadPDF(req, res, next) {
  try {
    const invoiceResult = await pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (invoiceResult.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });

    const invoice = invoiceResult.rows[0];
    const [itemsRes, userResult] = await Promise.all([
      pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order', [invoice.id]),
      pool.query('SELECT business_name, email, business_address, business_phone, currency FROM users WHERE id = $1', [req.userId]),
    ]);
    invoice.items = itemsRes.rows;
    const user = userResult.rows[0];

    const pdfBuffer = await generateInvoicePDF(invoice, user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoice_number}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await pool.query(
      `DELETE FROM invoices WHERE id = $1 AND user_id = $2 AND status = 'draft' RETURNING id`,
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found or cannot be deleted (only drafts can be deleted)' });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    next(err);
  }
}
