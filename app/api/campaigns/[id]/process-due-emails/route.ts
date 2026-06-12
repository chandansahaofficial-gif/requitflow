import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendEmail } from '@/lib/smtp';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const campaignId = params.id;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    if (campaign.status === 'Paused' || campaign.status === 'Stopped') {
      return NextResponse.json({ error: 'Campaign is not active' }, { status: 400 });
    }

    // Fetch all approved emails that are strictly pending (Draft)
    const dueEmails = await prisma.emailSequence.findMany({
      where: {
        campaignId,
        approvalStatus: 'Approved',
        status: 'Draft',
        lead: {
          email: { not: null },
          // Do not send to leads that have replied or unsubscribed or bounced or booked call
          status: { notIn: ['Replied', 'Unsubscribed', 'Bounced', 'Call Booked'] }
        }
      },
      include: { lead: true },
      orderBy: { sequenceStep: 'asc' }
    });

    let sentCount = 0;
    const errors = [];

    // Simple queue simulation
    for (const sequence of dueEmails) {
      // Respect delay rules.
      // E.g., for step 2, it should only be sent if step 1 was sent `delayDays` ago.
      if (sequence.sequenceStep > 1) {
        const prevStep = await prisma.emailSequence.findFirst({
          where: { campaignId, leadId: sequence.leadId, sequenceStep: sequence.sequenceStep - 1 }
        });
        if (!prevStep || prevStep.status !== 'Sent' || !prevStep.sentAt) {
          continue; // Wait for previous step to be sent first
        }
        
        const daysSincePrev = (new Date().getTime() - prevStep.sentAt.getTime()) / (1000 * 3600 * 24);
        if (daysSincePrev < sequence.delayDays) {
          continue; // Not due yet
        }
      }

      // Check unsubscribe list globally again just in case
      const isUnsub = await prisma.unsubscribeList.findUnique({
        where: { userId_email: { userId: user.id, email: sequence.lead.email! } }
      });
      if (isUnsub) continue;

      const finalSubject = sequence.editedSubject || sequence.aiOriginalSubject || sequence.subject;
      const finalBody = sequence.editedBody || sequence.aiOriginalBody || sequence.body;

      try {
        await sendEmail({
          userId: user.id,
          to: sequence.lead.email!,
          subject: finalSubject,
          html: finalBody.replace(/\n/g, '<br/>')
        });

        await prisma.emailSequence.update({
          where: { id: sequence.id },
          data: { status: 'Sent', sentAt: new Date() }
        });

        await prisma.emailSendLog.create({
          data: {
            campaignId: sequence.campaignId,
            leadId: sequence.leadId,
            emailSequenceId: sequence.id,
            subject: finalSubject,
            body: finalBody,
            status: 'Sent',
            sentAt: new Date()
          }
        });

        // Delay between emails based on settings
        const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
        const delaySeconds = settings?.emailDelaySeconds || 30;
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        
        sentCount++;
      } catch (sendError: any) {
        console.error("Queue Send Failed:", sendError);
        
        await prisma.emailSequence.update({
          where: { id: sequence.id },
          data: { status: 'Failed', errorMessage: sendError.message }
        });
        
        errors.push({ id: sequence.id, error: sendError.message });
      }
    }

    return NextResponse.json({ success: true, sentCount, errors });
  } catch (error: any) {
    console.error("Process due emails error:", error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
