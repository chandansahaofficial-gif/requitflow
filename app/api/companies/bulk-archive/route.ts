import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { companyIds } = await req.json();

    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return NextResponse.json({ error: 'No companies selected' }, { status: 400 });
    }

    await prisma.company.updateMany({
      where: { 
        id: { in: companyIds }
      },
      data: {
        archived: true,
        archivedAt: new Date(),
        archivedBy: user.id
      }
    });

    return NextResponse.json({ success: true, archivedCount: companyIds.length });

  } catch (error: any) {
    console.error('Bulk archive companies error:', error);
    return NextResponse.json({ error: 'Failed to bulk archive companies' }, { status: 500 });
  }
}
