import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const { checkCampaignReadyToStart } = await import('@/lib/campaign-ready');
    const readyCheck = await checkCampaignReadyToStart(id, user.id);
    
    if (!readyCheck.ready) {
      return NextResponse.json({
        success: false,
        error: "Campaign is not ready to start.",
        missingRequirements: readyCheck.missingRequirements
      }, { status: 400 });
    }

    // Find sequences to schedule (Approved, Step 1, not unsubscribed)
    const sequencesToSchedule = await prisma.emailSequence.findMany({
      where: {
        campaignId: id,
        sequenceStep: 1,
        approvalStatus: 'Approved',
        status: 'Draft',
        lead: { status: { not: "Unsubscribed" } }
      }
    });

    if (sequencesToSchedule.length > 0) {
      await prisma.emailSequence.updateMany({
        where: { id: { in: sequencesToSchedule.map(s => s.id) } },
        data: { status: 'Scheduled' }
      });
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'Active' }
    });

    // We can run process-due-emails logic in the background, or tell the frontend to hit it.
    // For now, simply mark active. A chron job / background task should hit process-due-emails.
    // Or we hit the local API asynchronously.
    
    // Fire and forget
    fetch(`${req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/campaigns/${id}/process-due-emails`, {
      method: 'POST',
      headers: { cookie: req.headers.get('cookie') || '' }
    }).catch(console.error);

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
