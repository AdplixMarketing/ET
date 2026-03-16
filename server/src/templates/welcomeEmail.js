import { wrapEmail } from './baseEmail.js';

export function welcomeEmailTemplate(planName) {
  return wrapEmail(`
    <h2>Welcome to ${planName}!</h2>
    <p>Your upgrade is confirmed. Here's what you now have access to:</p>
    <ul style="padding-left: 20px; font-size: 14px; color: #3C3C43; line-height: 2;">
      <li>Unlimited transactions &amp; receipt scans</li>
      <li>Professional invoicing with PDF export</li>
      <li>Advanced reports with CSV &amp; PDF export</li>
      <li>Custom categories</li>
      ${planName === 'AddFi Max' ? `
      <li>Client database &amp; management</li>
      <li>Custom invoice templates</li>
      <li>Client payment portal</li>
      <li>Recurring transactions &amp; invoices</li>
      <li>Data import tools</li>
      <li>Advanced analytics</li>
      ` : ''}
    </ul>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${process.env.CLIENT_URL || 'https://addfi.co'}/dashboard" class="btn">Go to Dashboard</a>
    </p>
    <p>Questions? Just reply to this email — we're here to help.</p>
  `);
}
