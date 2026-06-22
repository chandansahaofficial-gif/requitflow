import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    if (campaign.userId !== user.id) return NextResponse.json({ error: 'Access denied.' }, { status: 403 });

    if (campaign.status !== 'Active') {
      return NextResponse.json({ error: 'This campaign is not active and cannot be paused.' }, { status: 400 });
    }

    // Unschedule any pending Scheduled emails (move back to Draft)
    await prisma.emailSequence.updateMany({
      where: {
        campaignId: id,
        status: 'Scheduled'
      },
      data: { status: 'Draft' }
    });

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'Paused' }
    });

    return NextResponse.json({ success: true, campaign: updatedCampaign });
  } catch (error: any) {
    console.error('Pause campaign error:', error);
    return NextResponse.json({ error: 'Something went wrong while pausing the campaign. Please try again.' }, { status: 500 });
  }
}
