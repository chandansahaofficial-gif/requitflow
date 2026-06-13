import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = params.id;
    if (companyId.startsWith('unlinked-')) {
        return NextResponse.json({ error: 'Cannot view details for synthetic group directly.' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        jobs: true
      }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error: any) {
    console.error('Error fetching company details:', error);
    return NextResponse.json({ error: 'Failed to fetch company details' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // We do a soft delete (archive)
    const company = await prisma.company.update({
      where: { id: params.id },
      data: { archived: true }
    });

    return NextResponse.json({ message: 'Company archived successfully', company });
  } catch (error: any) {
    console.error('Error archiving company:', error);
    return NextResponse.json({ error: 'Failed to archive company' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (body.action === 'restore') {
      const company = await prisma.company.update({
        where: { id: params.id },
        data: { archived: false }
      });
      return NextResponse.json({ message: 'Company restored successfully', company });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in company POST route:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
