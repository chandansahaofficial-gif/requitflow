import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const campaignId = url.searchParams.get('campaignId');

  const whereClause: any = { userId: user.id };
  if (campaignId) {
    whereClause.campaignId = campaignId;
  }

  const leads = await prisma.lead.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ leads });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();

  const lead = await prisma.lead.create({
    data: {
      ...data,
      userId: user.id,
    }
  });

  return NextResponse.json({ lead });
}
