import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            leads: true,
            emailSequences: true,
            campaignLeads: true,
            replies: true,
            bookedCalls: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enrich each campaign with pending/approved email counts for Email Step 1
    const enriched = await Promise.all(campaigns.map(async (camp) => {
      const [totalDrafts, pendingReview, approvedEmail1] = await Promise.all([
        prisma.emailSequence.count({ where: { campaignId: camp.id } }),
        prisma.emailSequence.count({ where: { campaignId: camp.id, approvalStatus: 'Pending' } }),
        prisma.emailSequence.count({ where: { campaignId: camp.id, sequenceStep: 1, approvalStatus: 'Approved' } }),
      ]);
      return { ...camp, totalDrafts, pendingReview, approvedEmail1 };
    }));

    return NextResponse.json({ campaigns: enriched });
  } catch (error: any) {
    console.error('Fetch campaigns error:', error);
    return NextResponse.json({ error: 'Something went wrong while loading your campaigns. Please try again.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();

    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Campaign name is required.' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        goal: data.goal,
        campaignType: data.campaignType || 'Client Outreach',
        targetAudience: data.targetAudience,
        industry: data.industry,
        offer: data.offer,
        tone: data.tone || 'Professional',
        language: data.language || 'English',
        ctaType: data.ctaType || 'Book Discovery Call',
        ctaLink: data.ctaLink,
        bookingLink: data.bookingLink || data.ctaLink,
        senderName: data.senderName,
        agencyName: data.agencyName,
        emailSignature: data.emailSignature,
        sendingMode: data.sendingMode || 'Human Approval Mode',
        status: 'Draft',
        userId: user.id,
        // New fields from PRD §22
        problemSolved: data.problemSolved,
        mainBenefit: data.mainBenefit,
        proofCaseStudy: data.proofCaseStudy,
        unsubscribeLine: data.unsubscribeLine,
        senderEmail: data.senderEmail,
        dailyLimit: parseInt(String(data.dailyLimit)) || 50,
        followUpCount: parseInt(String(data.followUpCount)) || 5,
        personalizationLevel: data.personalizationLevel,
        emailLength: data.emailLength,
        spamSafety: data.spamSafety,
        ctaStyle: data.ctaStyle,
      }
    });

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error('Create campaign error:', error);
    return NextResponse.json({ error: 'Something went wrong while creating your campaign. Please try again.', details: error?.message || String(error) }, { status: 500 });
  }
}
