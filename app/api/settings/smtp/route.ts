import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';

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
    const { smtpHost, smtpPort, smtpUser, smtpPass, fromName, fromEmail, replyToEmail } = await req.json();

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromName || !fromEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const dataToSave = {
      smtpHost,
      smtpPort: parseInt(smtpPort, 10),
      smtpUserEncrypted: encrypt(smtpUser),
      smtpPassEncrypted: encrypt(smtpPass),
      fromName,
      fromEmail,
      replyToEmail: replyToEmail || null,
      status: "Active"
    };

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
