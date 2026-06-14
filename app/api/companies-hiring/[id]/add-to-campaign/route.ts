import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in again.' }, { status: 401 });
    }

    const { campaignId } = await req.json();
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    const { id: companyId } = await params; // Next.js 15 requires awaiting params
    if (companyId.startsWith('unlinked-')) {
        return NextResponse.json({ error: 'Cannot add synthetic group to campaigns.' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // First ensure the lead exists
    let lead = await prisma.lead.findFirst({
      where: {
        userId: user.id,
        companyId: companyId
      }
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          userId: user.id,
          companyId: company.id,
          businessName: company.name,
          website: company.website,
          phone: null,
          email: null,
          address: company.location,
          country: company.country,
          category: 'Unknown',
          source: 'Companies Hiring',
          status: 'New'
        }
      });
    }

    // Now check if it's already in the campaign
    const existingCampaignLead = await prisma.campaignLead.findFirst({
      where: {
        campaignId: campaignId,
        leadId: lead.id
      }
    });

    if (existingCampaignLead) {
      return NextResponse.json({ status: 'Already Exists', campaignLead: existingCampaignLead });
    }

    // Add to campaign
    const newCampaignLead = await prisma.campaignLead.create({
      data: {
        campaignId: campaignId,
        leadId: lead.id,
        status: 'Pending'
      }
    });

    // Update lead status to reflect it's in a campaign
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'Added to Campaign' }
    });

    return NextResponse.json({ status: 'Added', campaignLead: newCampaignLead });

  } catch (error: any) {
    console.error('Add to Campaign error:', error);
    return NextResponse.json({ error: 'Failed to add to campaign' }, { status: 500 });
  }
}
