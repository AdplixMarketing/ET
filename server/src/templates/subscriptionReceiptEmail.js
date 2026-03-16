import { wrapEmail } from './baseEmail.js';

export function subscriptionReceiptTemplate({ amount, planName, date, periodEnd }) {
  return wrapEmail(`
    <h2>Payment Confirmation</h2>
    <p>Your ${planName} subscription payment has been processed.</p>
    <div style="background: #f5f5f7; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <table style="width: 100%; font-size: 14px; color: #3C3C43;">
        <tr>
          <td style="padding: 4px 0; color: #8E8E93;">Plan</td>
          <td style="text-align: right; font-weight: 600;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #8E8E93;">Amount</td>
          <td style="text-align: right; font-weight: 600;">$${(amount / 100).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #8E8E93;">Date</td>
          <td style="text-align: right;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #8E8E93;">Next billing</td>
          <td style="text-align: right;">${periodEnd}</td>
        </tr>
      </table>
    </div>
    <p style="font-size: 12px; color: #8E8E93;">Manage your subscription anytime from Settings.</p>
  `);
}
