import { wrapEmail } from './baseEmail.js';

export function resetPasswordTemplate(resetUrl) {
  return wrapEmail(`
    <h2>Reset your password</h2>
    <p>We received a request to reset your password. Click the button below to choose a new one.</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </p>
    <p style="font-size: 12px; color: #8E8E93;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
  `);
}
