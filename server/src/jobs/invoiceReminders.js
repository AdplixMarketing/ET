import cron from 'node-cron';
import pool from '../config/db.js';
import { sendEmail } from '../services/email.service.js';
import { auditLog } from '../services/audit.service.js';

export function startInvoiceReminderJob() {
  // Run daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      // Find overdue invoices for Max users that haven't been reminded in the last 3 days
      const result = await pool.query(
        `SELECT i.id, i.invoice_number, i.client_name, i.client_email, i.total, i.due_date,
                i.portal_token, i.portal_payment_enabled,
                u.id as user_id, u.business_name, u.plan
         FROM invoices i
         JOIN users u ON i.user_id = u.id
         WHERE i.status = 'overdue'
           AND u.plan = 'max'
           AND i.client_email IS NOT NULL
           AND i.client_email != ''
           AND (i.last_reminder_at IS NULL OR i.last_reminder_at < NOW() - INTERVAL '3 days')`
      );

      for (const inv of result.rows) {
        const portalLink = inv.portal_token
          ? `${process.env.CLIENT_URL || 'https://addfi.co'}/portal/${inv.portal_token}`
          : null;

        const payButton = inv.portal_payment_enabled && portalLink
          ? `<a href="${portalLink}" style="display:inline-block;padding:14px 28px;background:#4A90E2;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Pay Now</a>`
          : portalLink
            ? `<a href="${portalLink}" style="display:inline-block;padding:14px 28px;background:#4A90E2;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Invoice</a>`
            : '';

        const dueDate = new Date(inv.due_date).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        });

        const total = parseFloat(inv.total).toLocaleString('en-US', {
          style: 'currency', currency: 'USD',
        });

        const html = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:500px;margin:0 auto;">
            <div style="padding:32px 24px;">
              <h2 style="font-size:20px;font-weight:700;margin:0 0 16px;color:#1F2937;">Payment Reminder</h2>
              <p style="color:#4B5563;font-size:15px;line-height:1.6;margin:0 0 20px;">
                Hi ${inv.client_name},
              </p>
              <p style="color:#4B5563;font-size:15px;line-height:1.6;margin:0 0 20px;">
                This is a friendly reminder that invoice <strong>${inv.invoice_number}</strong> for <strong>${total}</strong> was due on <strong>${dueDate}</strong> and remains unpaid.
              </p>
              <div style="background:#FEF3C7;border-radius:8px;padding:16px;margin:0 0 24px;">
                <div style="font-size:14px;color:#92400E;font-weight:600;">Amount Due: ${total}</div>
                <div style="font-size:13px;color:#92400E;margin-top:4px;">Due Date: ${dueDate}</div>
              </div>
              ${payButton ? `<div style="text-align:center;margin:0 0 24px;">${payButton}</div>` : ''}
              <p style="color:#6B7280;font-size:13px;margin:0;">
                If you've already sent payment, please disregard this notice.
              </p>
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0 16px;" />
              <p style="color:#9CA3AF;font-size:12px;margin:0;">
                Sent by ${inv.business_name || 'AddFi'}
              </p>
            </div>
          </div>
        `;

        try {
          await sendEmail({
            to: inv.client_email,
            subject: `Payment Reminder: Invoice ${inv.invoice_number} - ${total} overdue`,
            html,
          });

          await pool.query(
            'UPDATE invoices SET last_reminder_at = NOW() WHERE id = $1',
            [inv.id]
          );

          await auditLog(inv.user_id, 'invoice_reminder_sent', {
            entityType: 'invoice',
            entityId: inv.id,
            metadata: { client_email: inv.client_email },
          });

          console.log(`Reminder sent for invoice ${inv.invoice_number} to ${inv.client_email}`);
        } catch (emailErr) {
          console.error(`Failed to send reminder for ${inv.invoice_number}:`, emailErr.message);
        }
      }

      if (result.rows.length > 0) {
        console.log(`Processed ${result.rows.length} overdue invoice reminder(s)`);
      }
    } catch (err) {
      console.error('Invoice reminder job failed:', err.message);
    }
  });

  console.log('Invoice reminder cron job scheduled (daily at 9 AM)');
}
