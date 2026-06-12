import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const campaignId = params.id;

  try {
    // Fetch all leads in this campaign along with their email sequences
    const campaignLeads = await prisma.campaignLead.findMany({
      where: { campaignId },
      include: {
        lead: {
          include: {
            emailSequences: {
              where: { campaignId },
              orderBy: { sequenceStep: 'asc' }
            }
          }
        }
      },
      orderBy: { addedAt: 'desc' }
    });

    return NextResponse.json({ campaignLeads });
  } catch (error: any) {
    console.error("Fetch email sequences error:", error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
