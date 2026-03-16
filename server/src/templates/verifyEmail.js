import { wrapEmail } from './baseEmail.js';

export function verifyEmailTemplate(verifyUrl) {
  return wrapEmail(`
    <h2>Verify your email</h2>
    <p>Thanks for signing up for AddFi! Please verify your email address to get started.</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${verifyUrl}" class="btn">Verify Email</a>
    </p>
    <p style="font-size: 12px; color: #8E8E93;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  `);
}
