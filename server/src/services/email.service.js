import { Resend } from 'resend';

const FROM_EMAIL = process.env.EMAIL_FROM || 'support@addfi.co';
const FROM_NAME = 'AddFi';

let resend = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export async function sendEmail({ to, subject, html, attachments, replyTo }) {
  if (!resend) {
    console.log(`[Email] No RESEND_API_KEY configured. Would send to ${to}: ${subject}`);
    return;
  }

  const msg = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  };

  if (replyTo) {
    msg.replyTo = replyTo;
  }

  if (attachments) {
    msg.attachments = attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content, 'base64'),
      contentType: a.type,
    }));
  }

  try {
    await resend.emails.send(msg);
    console.log(`[Email] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
    throw err;
  }
}
