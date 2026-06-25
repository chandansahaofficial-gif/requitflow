import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { decryptSmtpPass } from '@/lib/smtp-encryption';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const account = await prisma.smtpAccount.findUnique({
      where: { userId: user.id }
    });

    if (!account) {
      return NextResponse.json({ error: 'No SMTP settings found to test.' }, { status: 404 });
    }

    const password = decryptSmtpPass(account.smtpPassEncrypted);
    const username = decryptSmtpPass(account.smtpUserEncrypted);

    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.secure,
      auth: {
        user: username,
        pass: password,
      },
    });

    try {
      // Test connection
      await transporter.verify();

      // Optionally send a test email to the sender's own address
      const mailOptions = {
        from: `"${account.fromName}" <${account.fromEmail}>`,
        to: account.fromEmail,
        subject: 'Funnelzen AI: SMTP Connection Successful',
        text: 'Your SMTP settings have been successfully verified and saved.',
        html: '<strong>Your SMTP settings have been successfully verified and saved.</strong>'
      };

      await transporter.sendMail(mailOptions);

      // Mark as verified
      await prisma.smtpAccount.update({
        where: { id: account.id },
        data: { isVerified: true, status: 'Active' }
      });

      return NextResponse.json({ success: true, message: 'SMTP connection successful! A test email has been sent.' });
    } catch (verifyError: any) {
      console.error("SMTP Verify Error:", verifyError.message);
      
      // Mark as unverified
      await prisma.smtpAccount.update({
        where: { id: account.id },
        data: { isVerified: false, status: 'Failed' }
      });

      return NextResponse.json({ error: 'SMTP connection failed. Please check host, port, username, and password.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Test Route Error:", error.message);
    return NextResponse.json({ error: 'Internal server error during SMTP test.' }, { status: 500 });
  }
}
