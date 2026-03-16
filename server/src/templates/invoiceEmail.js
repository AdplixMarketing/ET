import { wrapEmail } from './baseEmail.js';

export function invoiceEmailTemplate({ invoiceNumber, clientName, businessName, total, dueDate, currency }) {
  return wrapEmail(`
    <h2>Invoice ${invoiceNumber}</h2>
    <p>Hi ${clientName},</p>
    <p>${businessName} has sent you an invoice.</p>
    <div style="background: #f5f5f7; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <table style="width: 100%; font-size: 14px; color: #3C3C43;">
        <tr>
          <td style="padding: 4px 0; color: #8E8E93;">Invoice #</td>
          <td style="text-align: right; font-weight: 600;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #8E8E93;">Amount Due</td>
          <td style="text-align: right; font-weight: 600; font-size: 18px; color: #4A90E2;">$${parseFloat(total).toFixed(2)} ${currency || 'USD'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #8E8E93;">Due Date</td>
          <td style="text-align: right;">${new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
        </tr>
      </table>
    </div>
    <p>Please find the invoice PDF attached.</p>
    <p style="font-size: 12px; color: #8E8E93;">This invoice was sent via AddFi on behalf of ${businessName}.</p>
  `);
}
