import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { encryptSmtpPass } from '@/lib/smtp-encryption';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const account = await prisma.smtpAccount.findUnique({
      where: { userId: user.id }
    });

    if (!account) return NextResponse.json({ account: null });

    // Do NOT return the decrypted password. Just return a boolean if it exists.
    return NextResponse.json({
      account: {
        smtpHost: account.smtpHost,
        smtpPort: account.smtpPort,
        fromName: account.fromName,
        fromEmail: account.fromEmail,
        replyToEmail: account.replyToEmail,
        secure: account.secure,
        dailyLimit: account.dailyLimit,
        delayBetweenEmailsSeconds: account.delayBetweenEmailsSeconds,
        isVerified: account.isVerified,
        status: account.status,
        hasPassword: !!account.smtpPassEncrypted
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, fromName, fromEmail, replyToEmail, secure, dailyLimit, delayBetweenEmailsSeconds } = await req.json();

    if (!fromEmail || !fromEmail.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid sender email.' }, { status: 400 });
    }
    if (!smtpHost) {
      return NextResponse.json({ error: 'SMTP host is required.' }, { status: 400 });
    }
    if (!smtpUser) {
      return NextResponse.json({ error: 'SMTP username is required.' }, { status: 400 });
    }

    const existingAccount = await prisma.smtpAccount.findUnique({ where: { userId: user.id } });

    if (!existingAccount && !smtpPass) {
      return NextResponse.json({ error: 'SMTP password is required for first setup.' }, { status: 400 });
    }

    const parsedDailyLimit = dailyLimit ? parseInt(dailyLimit, 10) : 10;
    if (parsedDailyLimit > 10) {
      return NextResponse.json({ error: 'Daily sending limit cannot be more than 10.' }, { status: 400 });
    }
    const finalDailyLimit = Math.min(Math.max(1, parsedDailyLimit), 10);

    const parsedDelay = delayBetweenEmailsSeconds ? parseInt(delayBetweenEmailsSeconds, 10) : 120;
    if (parsedDelay < 60) {
      return NextResponse.json({ error: 'Sending delay must be at least 60 seconds.' }, { status: 400 });
    }
    const finalDelay = Math.min(Math.max(60, parsedDelay), 900);

    const dataToSave: any = {
      smtpHost,
      smtpPort: parseInt(smtpPort, 10),
      smtpUserEncrypted: encryptSmtpPass(smtpUser),
      fromName,
      fromEmail,
      replyToEmail: replyToEmail || null,
      secure: secure !== undefined ? secure : true,
      dailyLimit: finalDailyLimit,
      delayBetweenEmailsSeconds: finalDelay,
      isVerified: false,
      status: "Active"
    };

    if (smtpPass) {
      dataToSave.smtpPassEncrypted = encryptSmtpPass(smtpPass);
    }

    const account = await prisma.smtpAccount.upsert({
      where: { userId: user.id },
      update: dataToSave,
      create: {
        userId: user.id,
        ...dataToSave
      }
    });

    return NextResponse.json({ success: true, message: 'SMTP settings saved successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
