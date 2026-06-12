import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();

    const existing = await prisma.emailSequence.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.emailSequence.update({
      where: { id: params.id },
      data: {
        subject: data.subject,
        previewText: data.previewText,
        body: data.body,
        delayDays: data.delayDays,
        editedSubject: data.subject !== existing.aiOriginalSubject ? data.subject : existing.editedSubject,
        editedBody: data.body !== existing.aiOriginalBody ? data.body : existing.editedBody,
      }
    });

    return NextResponse.json({ success: true, email: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
