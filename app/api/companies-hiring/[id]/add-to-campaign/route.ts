import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId } = await req.json();
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    const companyId = params.id;
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
