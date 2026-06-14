import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = params;

    // Verify the lead belongs to this user before deleting
    const lead = await prisma.lead.findFirst({
      where: { id, userId: user.id }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    await prisma.lead.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Lead deleted.' });

  } catch (error: any) {
    console.error('Delete lead error:', error);
    return NextResponse.json({ error: 'Delete failed.' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const lead = await prisma.lead.findFirst({
      where: { id, userId: user.id }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: body
    });

    return NextResponse.json({ success: true, lead: updated });

  } catch (error: any) {
    console.error('Update lead error:', error);
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  }
}
