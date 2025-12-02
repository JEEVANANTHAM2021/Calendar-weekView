import nodemailer from 'nodemailer';
import { config } from 'dotenv';

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  // Local development only
  config({ path: '../../.env' });
}

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const fromEmail = process.env.SMTP_FROM_EMAIL;

// Only warn in non-prod; in prod we intentionally skip SMTP
if (!host || !user || !pass || !fromEmail) {
  console.warn('[mailer] SMTP env vars not fully configured. Email sending will fail (in dev).');
}

export const mailer = !isProd
  ? nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for others
      auth: { user, pass },
    })
  : null;

export async function sendEventReminderMail(opts: {
  to: string;
  title: string;
  startISO: string;
}) {
  const { to, title, startISO } = opts;

  //In production (Render): just log and skip
  if (isProd) {
    console.log(
      '[mailer] (prod) would send reminder email:',
      { to, title, startISO }
    );
    return;
  }

  if (!mailer || !fromEmail) {
    console.warn('[mailer] SMTP not fully configured, skipping send.');
    return;
  }

  const start = new Date(startISO);
  const startText = start.toLocaleString();

  await mailer.sendMail({
    from: fromEmail,
    to,
    subject: `Reminder: ${title}`,
    text: `You have an upcoming event: "${title}" at ${startText}.`,
    html: `<p>You have an upcoming event: <strong>${title}</strong></p>
           <p>Start time: ${startText}</p>`,
  });

  console.log('[mailer] sent reminder email to', to, 'for', title);
}
