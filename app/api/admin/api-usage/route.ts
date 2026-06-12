import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const usageRecords = await prisma.aPIUsage.groupBy({
      by: ['provider', 'endpoint'],
      _sum: {
        requestCount: true,
        tokenUsage: true
      }
    });

    return NextResponse.json({ usage: usageRecords });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
