import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const totalUsers = await prisma.user.count();
    
    // Get job searches today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const searchesToday = await prisma.jobSearchHistory.count({
      where: { createdAt: { gte: today } }
    });

    const totalJobsFetched = await prisma.job.count();
    const totalJobsAnalyzed = await prisma.aIJobAnalysis.count();
    const resumeUploads = await prisma.resume.count();
    const applicationsTracked = await prisma.jobApplication.count();
    const activeCompanies = await prisma.company.count({
      where: { activeJobPostCount: { gt: 0 } }
    });

    return NextResponse.json({
      totalUsers,
      searchesToday,
      totalJobsFetched,
      totalJobsAnalyzed,
      resumeUploads,
      applicationsTracked,
      activeCompanies
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
