import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: { leads: true, emailSequences: true, replies: true, bookedCalls: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();

  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      goal: data.goal,
      campaignType: data.campaignType,
      targetAudience: data.targetAudience,
      industry: data.industry,
      offer: data.offer,
      tone: data.tone,
      language: data.language,
      ctaType: data.ctaType,
      ctaLink: data.ctaLink,
      senderName: data.senderName,
      agencyName: data.agencyName,
      emailSignature: data.emailSignature,
      sendingMode: data.sendingMode || "Human Approval Mode",
      status: data.status || "Draft",
      userId: user.id,
    }
  });

  return NextResponse.json({ campaign });
}
