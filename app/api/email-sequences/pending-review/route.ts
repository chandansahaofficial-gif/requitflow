import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const pendingEmails = await prisma.emailSequence.findMany({
      where: {
        userId: user.id,
        approvalStatus: 'Pending',
        status: 'Draft'
      },
      include: {
        campaign: { select: { id: true, name: true } },
        lead: { select: { id: true, businessName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ pendingEmails });
  } catch (error: any) {
    console.error("Fetch pending emails error:", error);
    return NextResponse.json({ error: "Failed to fetch pending emails" }, { status: 500 });
  }
}
