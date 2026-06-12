import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';

export async function getTransporter(userId: string) {
  const account = await prisma.smtpAccount.findUnique({
    where: { userId }
  });

  if (!account || account.status !== 'Active') {
    throw new Error('SMTP account not configured or inactive');
  }

  const pass = decrypt(account.smtpPassEncrypted);

  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: decrypt(account.smtpUserEncrypted),
      pass: pass
    }
  });

  return { transporter, account };
}

export async function sendEmail({
  userId,
  to,
  subject,
  html,
  text
}: {
  userId: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const { transporter, account } = await getTransporter(userId);

  const mailOptions = {
    from: `"${account.fromName}" <${account.fromEmail}>`,
    to,
    replyTo: account.replyToEmail || account.fromEmail,
    subject,
    text: text || html.replace(/<[^>]*>?/gm, ''), // fallback strip html
    html
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}
