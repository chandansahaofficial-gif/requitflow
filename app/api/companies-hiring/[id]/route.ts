import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in again.' }, { status: 401 });
    }

    const { id: companyId } = await params; // Next.js 15 requires awaiting params
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in again.' }, { status: 401 });
    }

    const { id } = await params; // Next.js 15 requires awaiting params

    // We do a soft delete (archive)
    const company = await prisma.company.update({
      where: { id },
      data: { archived: true }
    });

    return NextResponse.json({ message: 'Company archived successfully', company });
  } catch (error: any) {
    console.error('Error archiving company:', error);
    return NextResponse.json({ error: 'Failed to archive company' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in again.' }, { status: 401 });
    }

    const { id } = await params; // Next.js 15 requires awaiting params
    const body = await req.json().catch(() => ({}));

    if (body.action === 'restore') {
      const company = await prisma.company.update({
        where: { id },
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
