import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await prisma.candidate.delete({
      where: { 
        id: id,
        userId: user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete candidate error:", error);
    return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 });
  }
}
