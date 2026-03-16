import sgMail from '@sendgrid/mail';

const FROM_EMAIL = process.env.EMAIL_FROM || 'support@addfi.co';
const FROM_NAME = 'AddFi';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendEmail({ to, subject, html, attachments }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[Email] Would send to ${to}: ${subject}`);
    return;
  }

  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    html,
  };

  if (attachments) {
    msg.attachments = attachments;
  }

  try {
    await sgMail.send(msg);
    console.log(`[Email] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
    throw err;
  }
}
