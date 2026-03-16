import cron from 'node-cron';
import pool from '../config/db.js';

export function startInvoiceOverdueJob() {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await pool.query(
        `UPDATE invoices SET status = 'overdue', updated_at = NOW()
         WHERE status = 'sent' AND due_date < CURRENT_DATE
         RETURNING id, invoice_number`
      );
      if (result.rowCount > 0) {
        console.log(`Marked ${result.rowCount} invoice(s) as overdue:`,
          result.rows.map(r => r.invoice_number).join(', '));
      }
    } catch (err) {
      console.error('Invoice overdue job failed:', err.message);
    }
  });

  console.log('Invoice overdue cron job scheduled (daily at midnight)');
}
