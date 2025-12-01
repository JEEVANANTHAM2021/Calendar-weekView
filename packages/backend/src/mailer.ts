import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config({path:'../../.env'})

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const fromEmail = process.env.SMTP_FROM_EMAIL;

if (!host || !user || !pass || !fromEmail) {
  console.warn('[mailer] SMTP env vars not fully configured. Email sending will fail.');
}

export const mailer = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // true for 465, false for others
  auth: { user, pass },
});

export async function sendEventReminderMail(opts: {
  to: string;
  title: string;
  startISO: string;
}) {
  if (!fromEmail) {
    console.warn('[mailer] SMTP_FROM_EMAIL not set, skipping send.');
    return;
  }

  const { to, title, startISO } = opts;

  const start = new Date(startISO);
  const startText = start.toLocaleString(); // could format prettier

  await mailer.sendMail({
    from: fromEmail,
    to,
    subject: `Reminder: ${title}`,
    text: `You have an upcoming event: "${title}" at ${startText}.`,
    html: `<p>You have an upcoming event: <strong>${title}</strong></p>
           <p>Start time: ${startText}</p>`,
  });
}
