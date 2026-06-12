import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: user.id },
      include: {
        job: {
          include: { company: true, aiJobAnalyses: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ savedJobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId, priority, notes, tags } = await req.json();

    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: { userId: user.id, jobId }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Job already saved' }, { status: 400 });
    }

    const savedJob = await prisma.savedJob.create({
      data: {
        userId: user.id,
        jobId,
        priority: priority || 'Medium',
        notes: notes || null,
        tags: tags || null
      }
    });

    return NextResponse.json({ savedJob });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
