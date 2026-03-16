import cron from 'node-cron';
import pool from '../config/db.js';

function advanceDate(date, frequency) {
  const d = new Date(date);
  switch (frequency) {
    case 'daily':     d.setDate(d.getDate() + 1); break;
    case 'weekly':    d.setDate(d.getDate() + 7); break;
    case 'biweekly':  d.setDate(d.getDate() + 14); break;
    case 'monthly':   d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

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

async function processRule(rule) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (rule.entity_type === 'transaction' && rule.transaction_template) {
      const t = rule.transaction_template;
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, date, description, category_id, vendor_or_client, payment_method, notes)
         VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8)`,
        [
          rule.user_id,
          t.type || 'expense',
          t.amount,
          t.description || '',
          t.category_id || null,
          t.vendor_or_client || null,
          t.payment_method || null,
          t.notes || null,
        ]
      );
    } else if (rule.entity_type === 'invoice' && rule.invoice_template_data) {
      const inv = rule.invoice_template_data;
      const invoice_number = await getNextInvoiceNumber(rule.user_id);
      const items = inv.items || [];
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      const tax_rate = inv.tax_rate || 0;
      const tax_amount = subtotal * (tax_rate / 100);
      const total = subtotal + tax_amount;

      const invResult = await client.query(
        `INSERT INTO invoices (user_id, invoice_number, client_name, client_email, client_id, due_date, notes, tax_rate, subtotal, tax_amount, total, status)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE + INTERVAL '30 days', $6, $7, $8, $9, $10, 'draft')
         RETURNING id`,
        [
          rule.user_id,
          invoice_number,
          inv.client_name || '',
          inv.client_email || null,
          inv.client_id || null,
          inv.notes || null,
          tax_rate,
          subtotal,
          tax_amount,
          total,
        ]
      );

      const invoiceId = invResult.rows[0].id;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await client.query(
          `INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [invoiceId, item.description || '', item.quantity, item.rate, item.quantity * item.rate, i]
        );
      }
    }

    // Advance next_run_date
    const nextDate = advanceDate(rule.next_run_date, rule.frequency);
    const shouldDeactivate = rule.end_date && nextDate > new Date(rule.end_date);

    await client.query(
      `UPDATE recurring_rules
       SET next_run_date = $2, last_run_at = NOW(), is_active = $3, updated_at = NOW()
       WHERE id = $1`,
      [rule.id, shouldDeactivate ? rule.next_run_date : nextDate.toISOString().split('T')[0], !shouldDeactivate]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Recurring rule ${rule.id} failed:`, err.message);
  } finally {
    client.release();
  }
}

export function startRecurringProcessor() {
  // Run at 1am daily
  cron.schedule('0 1 * * *', async () => {
    try {
      const result = await pool.query(
        `SELECT * FROM recurring_rules
         WHERE is_active = TRUE AND next_run_date <= CURRENT_DATE`
      );

      console.log(`Recurring processor: ${result.rows.length} rule(s) to process`);

      for (const rule of result.rows) {
        await processRule(rule);
      }
    } catch (err) {
      console.error('Recurring processor failed:', err.message);
    }
  });

  console.log('Recurring processor cron job scheduled (daily at 1am)');
}
