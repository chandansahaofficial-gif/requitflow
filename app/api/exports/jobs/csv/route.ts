import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stringify } from 'csv-stringify/sync';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, jobIds } = await req.json();

    let jobs: any[] = [];

    if (type === 'saved' || !jobIds) {
      const savedJobs = await prisma.savedJob.findMany({
        where: { userId: user.id },
        include: { job: { include: { company: true } } }
      });
      jobs = savedJobs.map((sj: any) => sj.job);
    } else {
      jobs = await prisma.job.findMany({
        where: { id: { in: jobIds } },
        include: { company: true }
      });
    }

    const dataToExport = jobs.map((job: any) => ({
      'Job Title': job.title,
      'Company': job.company?.name || 'N/A',
      'Location': job.location,
      'Work Mode': job.workMode,
      'Job Type': job.jobType,
      'Salary Min': job.salaryMin || '',
      'Salary Max': job.salaryMax || '',
      'Currency': job.salaryCurrency || '',
      'Date Posted': job.datePosted ? new Date(job.datePosted).toISOString().split('T')[0] : '',
      'Application URL': job.applicationUrl || '',
      'Vacancies': job.vacancies !== null ? job.vacancies : 'Not disclosed',
      'Candidates Needed': job.candidatesNeeded !== null ? job.candidatesNeeded : 'Not disclosed',
      'Hiring Urgency': job.hiringUrgency || 'N/A'
    }));

    const csvData = stringify(dataToExport, { header: true });

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="jobs_export.csv"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
