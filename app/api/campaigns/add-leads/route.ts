import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { campaignId, leadIds } = await req.json();

    if (!campaignId || !leadIds || !Array.isArray(leadIds)) {
      return NextResponse.json({ error: 'Missing campaignId or leadIds' }, { status: 400 });
    }

    // Verify campaign belongs to user
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Process additions (skip duplicates implicitly by using createMany with skipDuplicates if supported, 
    // or handle individually. SQLite doesn't always love createMany skipDuplicates, but we use PostgreSQL.
    // Let's do a find to check existing first to be safe and update statuses.)
    const existing = await prisma.campaignLead.findMany({
      where: {
        campaignId,
        leadId: { in: leadIds }
      },
      select: { leadId: true }
    });
    const existingIds = existing.map(e => e.leadId);
    
    const newLeadIds = leadIds.filter(id => !existingIds.includes(id));

    if (newLeadIds.length > 0) {
      await prisma.campaignLead.createMany({
        data: newLeadIds.map(leadId => ({
          campaignId,
          leadId,
          status: 'Pending'
        })),
        skipDuplicates: true
      });

      // Update lead statuses to show they are in a campaign
      await prisma.lead.updateMany({
        where: { id: { in: newLeadIds } },
        data: { status: 'Added to Campaign', campaignId: campaignId }
      });
    }

    return NextResponse.json({ 
      success: true, 
      addedCount: newLeadIds.length,
      skippedCount: existingIds.length 
    });

  } catch (error: any) {
    console.error("Add to campaign error:", error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
