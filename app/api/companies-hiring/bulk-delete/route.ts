import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { companyIds } = await req.json();

    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return NextResponse.json({ error: 'No company IDs provided.' }, { status: 400 });
    }

    // Delete jobs first (FK constraint), then companies
    await prisma.job.deleteMany({
      where: { companyId: { in: companyIds } }
    });

    const result = await prisma.company.deleteMany({
      where: { id: { in: companyIds } }
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `${result.count} ${result.count === 1 ? 'company' : 'companies'} permanently deleted.`
    });

  } catch (error: any) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Delete failed. Please try again.' }, { status: 500 });
  }
}
