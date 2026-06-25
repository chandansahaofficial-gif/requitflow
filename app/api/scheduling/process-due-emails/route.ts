import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCampaignEmail } from '@/lib/sendgrid';
export async function POST(req: Request) {
  try {
    // Check authorization (e.g. cron secret)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Find all approved, scheduled emails that are due
    const dueEmails = await prisma.emailSequence.findMany({
      where: {
        status: 'Scheduled', // Must be scheduled
        approvalStatus: 'Approved',
        scheduledAt: { lte: now },
      },
      include: {
        lead: true,
        campaign: true,
        user: true
      },
      take: 50 // process in batches of 50
    });

    const results = [];

    for (const email of dueEmails) {
      // We no longer check for SMTP account status here.
      // sendCampaignEmail handles verification internally using SendGrid env variables.

      // Check if lead replied or unsubscribed to prevent sending
      if (email.lead.status === 'Replied' || email.lead.status === 'Unsubscribed') {
        await prisma.emailSequence.update({
          where: { id: email.id },
          data: { status: 'Stopped', timingReason: `Stopped due to lead status: ${email.lead.status}` }
        });
        results.push({ id: email.id, status: 'stopped', reason: email.lead.status });
        continue;
      }

      try {
        const sendResult = await sendCampaignEmail({
          to: email.lead.email!,
          subject: email.subject,
          html: email.body,
          campaignId: email.campaignId,
          leadId: email.leadId,
          emailSequenceId: email.id
        });

        if (!sendResult.success) {
          throw new Error(sendResult.error);
        }

        // Log the send
        await prisma.emailSendLog.create({
          data: {
            campaignId: email.campaignId,
            leadId: email.leadId,
            emailSequenceId: email.id,
            subject: email.subject,
            body: email.body,
            status: 'Sent'
          }
        });

        await prisma.emailSequence.update({
          where: { id: email.id },
          data: { status: 'Sent', sentAt: new Date() }
        });
        
        results.push({ id: email.id, status: 'sent' });
      } catch (err: any) {
        console.error(`SMTP Send failed for sequence ${email.id}`, err);
        await prisma.emailSequence.update({
          where: { id: email.id },
          data: { status: 'Failed', errorMessage: err.message }
        });
        results.push({ id: email.id, status: 'failed', reason: err.message });
      }
    }

    return NextResponse.json({ success: true, processed: dueEmails.length, results });

  } catch (error: any) {
    console.error('Process Due Emails Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
