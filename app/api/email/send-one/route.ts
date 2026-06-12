import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';
import { sendEmail } from '@/services/email';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
  if (!settings || !settings.smtpPassEncrypted || !settings.smtpHost || !settings.smtpPort || !settings.smtpUserEncrypted) {
    return NextResponse.json({ error: 'SMTP settings incomplete' }, { status: 400 });
  }

  const smtpPass = decrypt(settings.smtpPassEncrypted);
  const smtpUser = decrypt(settings.smtpUserEncrypted);
  
  const { sequenceId } = await req.json();

  const sequence = await prisma.emailSequence.findUnique({ 
    where: { id: sequenceId },
    include: { lead: true }
  });

  if (!sequence || !sequence.lead.email) {
    return NextResponse.json({ error: 'Sequence not found or lead has no email' }, { status: 404 });
  }

  try {
    await sendEmail({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort),
      user: smtpUser,
      pass: smtpPass,
      fromName: settings.smtpFromName || (user as any).name,
      fromEmail: settings.smtpFromEmail || smtpUser,
      to: sequence.lead.email,
      subject: sequence.subject,
      html: sequence.body.replace(/\n/g, '<br/>'),
    });

    const updated = await prisma.emailSequence.update({
      where: { id: sequence.id },
      data: { status: 'Sent', sentAt: new Date() }
    });

    return NextResponse.json({ sequence: updated });
  } catch (error: any) {
    await prisma.emailSequence.update({
      where: { id: sequence.id },
      data: { status: 'Failed', errorMessage: error.message }
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
