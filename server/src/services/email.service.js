import nodemailer from 'nodemailer';

const FROM_EMAIL = process.env.EMAIL_FROM || 'support@addfi.co';
const FROM_NAME = 'AddFi';

let transporter = null;

if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail({ to, subject, html, attachments }) {
  if (!transporter) {
    console.log(`[Email] No SMTP configured. Would send to ${to}: ${subject}`);
    return;
  }

  const msg = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  };

  if (attachments) {
    msg.attachments = attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.type,
    }));
  }

  try {
    await transporter.sendMail(msg);
    console.log(`[Email] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
    throw err;
  }
}
