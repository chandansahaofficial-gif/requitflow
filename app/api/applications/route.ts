import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const applications = await prisma.jobApplication.findMany({
      where: { userId: user.id },
      include: {
        job: { include: { company: true } },
        candidateProfile: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ applications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId, candidateProfileId, status, applicationDate, notes, applicationMessage, coverLetter } = await req.json();

    const application = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        jobId,
        candidateProfileId: candidateProfileId || null,
        status: status || 'Applied',
        applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
        notes: notes || null,
        applicationMessage: applicationMessage || null,
        coverLetter: coverLetter || null,
      }
    });

    return NextResponse.json({ application });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
