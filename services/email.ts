import nodemailer from 'nodemailer';

export interface EmailOptions {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  const transporter = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.port === 465, // true for 465, false for other ports
    auth: {
      user: options.user,
      pass: options.pass,
    },
  });

  const info = await transporter.sendMail({
    from: `"${options.fromName}" <${options.fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  return info;
}
