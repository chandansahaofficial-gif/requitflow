import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Delete all jobs and companies to ensure we only have fresh Apify data
    const jobsDeleted = await prisma.job.deleteMany({});
    const companiesDeleted = await prisma.company.deleteMany({});

    return NextResponse.json({ 
      success: true, 
      message: `Database cleared. Deleted ${jobsDeleted.count} old jobs and ${companiesDeleted.count} old companies. You can now sync fresh data from Apify.` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
