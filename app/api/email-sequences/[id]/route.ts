import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    const { id } = await params;

    const existing = await prisma.emailSequence.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Email draft not found.' }, { status: 404 });
    }

    const newSubject = data.subject ?? existing.subject;
    const newBody = data.body ?? existing.body;

    if (!newSubject || !newSubject.trim()) {
      return NextResponse.json({ error: 'Subject cannot be empty.' }, { status: 400 });
    }
    if (!newBody || !newBody.trim()) {
      return NextResponse.json({ error: 'Body cannot be empty.' }, { status: 400 });
    }

    const subjectEdited = newSubject !== existing.aiOriginalSubject;
    const bodyEdited = newBody !== existing.aiOriginalBody;

    const updated = await prisma.emailSequence.update({
      where: { id },
      data: {
        subject: newSubject,
        previewText: data.previewText ?? existing.previewText,
        body: newBody,
        delayAmount: data.delayAmount ?? existing.delayAmount,
        editedSubject: subjectEdited ? newSubject : existing.editedSubject,
        editedBody: bodyEdited ? newBody : existing.editedBody,
        // Auto-approve only if save-and-approve was requested
        ...(data.approve === true ? {
          approvalStatus: 'Approved',
          approvedAt: new Date()
        } : {})
      }
    });

    return NextResponse.json({ success: true, email: updated });
  } catch (error: any) {
    console.error('Update email sequence error:', error);
    return NextResponse.json({ error: 'Something went wrong while saving your changes. Please try again.' }, { status: 500 });
  }
}

// Keep PUT for backward compat
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(req, { params });
}
