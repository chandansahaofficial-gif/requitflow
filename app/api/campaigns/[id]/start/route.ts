import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkCampaignReadyToStart } from '@/lib/campaign-ready';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    // Verify campaign ownership
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    if (campaign.userId !== user.id) return NextResponse.json({ error: 'Access denied.' }, { status: 403 });

    if (campaign.status === 'Active') {
      return NextResponse.json({ error: 'This campaign is already active.' }, { status: 400 });
    }

    // Backend readiness check — source of truth
    const readyCheck = await checkCampaignReadyToStart(id, user.id);

    if (!readyCheck.ready) {
      return NextResponse.json({
        success: false,
        error: 'Your campaign is not ready yet. Please complete the missing items.',
        items: readyCheck.items,
        missingRequirements: readyCheck.missingRequirements
      }, { status: 400 });
    }

    // Schedule approved Step 1 emails for non-unsubscribed leads
    const sequencesToSchedule = await prisma.emailSequence.findMany({
      where: {
        campaignId: id,
        sequenceStep: 1,
        approvalStatus: 'Approved',
        status: 'Draft',
        lead: { status: { not: 'Unsubscribed' } }
      }
    });

    if (sequencesToSchedule.length > 0) {
      await prisma.emailSequence.updateMany({
        where: { id: { in: sequencesToSchedule.map(s => s.id) } },
        data: { status: 'Scheduled' }
      });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'Active' }
    });

    // Fire and forget — trigger email sending worker
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${origin}/api/campaigns/${id}/process-due-emails`, {
      method: 'POST',
      headers: { cookie: req.headers.get('cookie') || '' }
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
      scheduledCount: sequencesToSchedule.length
    });
  } catch (error: any) {
    console.error('Start campaign error:', error);
    return NextResponse.json({ error: 'Something went wrong while starting the campaign. Please try again.' }, { status: 500 });
  }
}
