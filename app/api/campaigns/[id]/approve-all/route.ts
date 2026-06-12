import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { leadId, allSelectedLeads } = await req.json().catch(() => ({}));

    // Verify campaign ownership
    const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    let whereClause: any = { campaignId: params.id, userId: user.id };
    
    if (leadId) {
      // Approve all for a specific lead
      whereClause.leadId = leadId;
    } else if (allSelectedLeads && Array.isArray(allSelectedLeads)) {
      // Approve all for specific selected leads
      whereClause.leadId = { in: allSelectedLeads };
    }

    const updated = await prisma.emailSequence.updateMany({
      where: whereClause,
      data: {
        approvalStatus: "Approved",
        approvedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
