import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCampaignEmail } from '@/lib/email-dispatch';

export async function GET(req: Request) {
  // NOTE: On Vercel Hobby, use an external cron service to call `/api/email/process-due` 
  // every 5 minutes with the CRON_SECRET authorization header. Vercel Pro can use native Vercel Cron.
  
  // CRON_SECRET Protection
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized cron request.' },
      { status: 401 }
    );
  }

  try {
    let processedCount = 0;
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // 1. Fetch active campaigns
    const activeCampaigns = await prisma.campaign.findMany({
      where: { status: 'Active' },
      select: { id: true, userId: true }
    });

    if (activeCampaigns.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        sent: 0,
        failed: 0,
        skipped: 0
      });
    }

    const campaignIds = activeCampaigns.map(c => c.id);

    // 2. Fetch due, approved email sequences across these campaigns
    // Limit global fetch to a safe batch size to avoid timeouts
    const GLOBAL_BATCH_MAX = 25;

    const dueEmails = await prisma.emailSequence.findMany({
      where: {
        campaignId: { in: campaignIds },
        approvalStatus: 'Approved',
        status: { in: ['Draft', 'Scheduled'] },
        OR: [
          { scheduledAt: { lte: new Date() } },
          { scheduledAt: null, sequenceStep: 1 } // Fallback for step 1s without scheduledAt
        ],
        lead: {
          email: { not: null },
          status: { notIn: ['Replied', 'Unsubscribed', 'Bounced', 'Call Booked'] }
        }
      },
      include: {
        lead: true,
        campaign: { select: { userId: true } }
      },
      orderBy: { scheduledAt: 'asc' },
      take: GLOBAL_BATCH_MAX
    });

    // 3. Process limits per user
    const userLimitsCache: Record<string, { remainingLimit: number, smtp: any }> = {};

    for (const sequence of dueEmails) {
      processedCount++;
      const userId = sequence.campaign.userId;

      // Group & Validate User Limits
      if (userLimitsCache[userId] === undefined) {
        // Find SMTP settings to determine the user's explicit limit
        const smtpAccount = await prisma.smtpAccount.findUnique({ where: { userId } });
        const userExplicitLimit = smtpAccount?.dailyLimit || 10;
        const dailyLimit = Math.min(10, Math.max(1, userExplicitLimit));

        // Count emails sent by this user today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const sentTodayCount = await prisma.emailSendLog.count({
          where: {
            campaign: { userId },
            sentAt: { gte: startOfDay }
          }
        });

        const remaining = Math.max(0, dailyLimit - sentTodayCount);
        userLimitsCache[userId] = { remainingLimit: remaining, smtp: smtpAccount };
      }

      const userConfig = userLimitsCache[userId];

      // If user has no limit left for the day, skip
      if (userConfig.remainingLimit <= 0) {
        skippedCount++;
        continue;
      }

      // 4. Validate Lead explicitly once more for Unsubscribes
      const isUnsub = await prisma.unsubscribeList.findUnique({
        where: { userId_email: { userId, email: sequence.lead.email! } }
      });
      if (isUnsub) {
        skippedCount++;
        continue;
      }

      // Check empty
      const finalSubject = sequence.editedSubject || sequence.aiOriginalSubject || sequence.subject;
      const finalBody = sequence.editedBody || sequence.aiOriginalBody || sequence.body;

      if (!finalSubject || !finalBody) {
        skippedCount++;
        continue;
      }

      // 5. Check Sender Priority (User SMTP > SendGrid)
      const hasVerifiedSmtp = userConfig.smtp?.isVerified && userConfig.smtp?.status === 'Active';
      const hasSendGrid = !!process.env.SENDGRID_API_KEY && !!process.env.SENDGRID_FROM_EMAIL;

      if (!hasVerifiedSmtp && !hasSendGrid) {
        // Missing sender
        await prisma.emailSequence.update({
          where: { id: sequence.id },
          data: { status: 'Failed', errorMessage: 'Connect and verify SMTP or SendGrid before sending campaign emails.' }
        });
        failedCount++;
        continue;
      }

      // Decrement limit
      userConfig.remainingLimit -= 1;

      // 6. Send the Email!
      try {
        const sendResult = await sendCampaignEmail({
          to: sequence.lead.email!,
          subject: finalSubject,
          html: finalBody.replace(/\n/g, '<br/>'),
          campaignId: sequence.campaignId,
          leadId: sequence.leadId,
          emailSequenceId: sequence.id
        });

        if (!sendResult.success) {
          throw new Error(sendResult.error);
        }

        // Success Update
        await prisma.emailSequence.update({
          where: { id: sequence.id },
          data: { status: 'Sent', sentAt: new Date(), errorMessage: null }
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

        // 7. Schedule the next sequence step based on delay
        const nextStep = await prisma.emailSequence.findFirst({
          where: { campaignId: sequence.campaignId, leadId: sequence.leadId, sequenceStep: sequence.sequenceStep + 1 }
        });

        if (nextStep) {
          const delayAmount = (nextStep as any).delayAmount || (nextStep as any).delayDays || 1;
          const nextTime = new Date();
          nextTime.setDate(nextTime.getDate() + delayAmount);
          await prisma.emailSequence.update({
            where: { id: nextStep.id },
            data: { status: 'Scheduled', scheduledAt: nextTime }
          });
        }

        sentCount++;
      } catch (sendError: any) {
        console.error("Cron Send Failed:", sendError);

        await prisma.emailSequence.update({
          where: { id: sequence.id },
          data: { status: 'Failed', errorMessage: sendError.message || 'Unknown sending error' }
        });

        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount
    });

  } catch (error: any) {
    console.error("Global Cron Processor Error:", error);
    return NextResponse.json({ success: false, error: 'Internal cron error' }, { status: 500 });
  }
}
