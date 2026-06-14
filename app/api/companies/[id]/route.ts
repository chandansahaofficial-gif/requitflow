import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        jobs: {
          select: {
            id: true,
            externalId: true,
            applicationUrl: true,
            title: true,
            location: true,
            city: true,
            region: true,
            country: true,
            category: true,
            datePosted: true,
            vacancies: true,
            candidatesNeeded: true,
            vacancyStatus: true,
            hiringUrgency: true,
            aiSummary: true
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const uniqueJobs = new Map();

    company.jobs.forEach(job => {
      // Dedup logic: prefer externalId, then applicationUrl, then title+location
      const key = job.externalId || job.applicationUrl || `${company.name.toLowerCase()}-${job.title.toLowerCase()}-${(job.location || '').toLowerCase()}`;
      if (!uniqueJobs.has(key)) {
        uniqueJobs.set(key, job);
      }
    });

    const activeJobs = Array.from(uniqueJobs.values());
    const activeJobPostsFound = activeJobs.length;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let recentPosts7Days = 0;
    let recentPosts30Days = 0;
    let latestPostingDate: Date | null = null;
    
    const jobCategoriesSet = new Set<string>();
    const locationsSet = new Set<string>();

    activeJobs.forEach(job => {
      if (job.datePosted) {
        const postedDate = new Date(job.datePosted);
        if (postedDate >= sevenDaysAgo) recentPosts7Days++;
        if (postedDate >= thirtyDaysAgo) recentPosts30Days++;

        if (!latestPostingDate || postedDate > latestPostingDate) {
          latestPostingDate = postedDate;
        }
      }

      if (job.category) jobCategoriesSet.add(job.category);
      
      if (job.city) locationsSet.add(job.city);
      else if (job.region) locationsSet.add(job.region);
      else if (job.country) locationsSet.add(job.country);
      else if (job.location) locationsSet.add(job.location);
    });

    const jobCategories = Array.from(jobCategoriesSet);
    const locations = Array.from(locationsSet);

    let hiringActivity = 'Low Activity';
    if (activeJobPostsFound >= 10 || recentPosts7Days >= 5) {
      hiringActivity = 'High Activity';
    } else if (activeJobPostsFound >= 4 || recentPosts7Days >= 2) {
      hiringActivity = 'Medium Activity';
    }

    let hiringDemand = 'Low';
    if (activeJobPostsFound >= 10 && recentPosts7Days >= 3 && locations.length >= 2) {
      hiringDemand = 'High';
    } else if (activeJobPostsFound >= 4) {
      hiringDemand = 'Medium';
    }

    return NextResponse.json({
      companyId: company.id,
      companyName: company.name,
      activeJobPostsFound,
      recentPosts7Days,
      recentPosts30Days,
      jobCategories,
      locations,
      latestPostingDate,
      hiringActivity,
      hiringDemand,
      companyWebsite: company.website || null,
      aiHiringInsight: company.aiHiringInsight || '',
      jobs: activeJobs // Returning the unique jobs array for detailed view
    });

  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Failed to fetch company details' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bodyText = await req.text();
    let archiveReason = null;
    if (bodyText) {
      try {
        const body = JSON.parse(bodyText);
        archiveReason = body.archiveReason;
      } catch (e) {}
    }
    
    
    const company = await prisma.company.findUnique({
      where: { id }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    await prisma.company.update({
      where: { id },
      data: { 
        archived: true,
        archivedAt: new Date(),
        archiveReason: archiveReason || null
      }
    });

    return NextResponse.json({ success: true, archived: true });

  } catch (error: any) {
    console.error('Delete company error:', error);
    return NextResponse.json({ error: 'Failed to archive company' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { action } = await req.json();
    const { id } = await params;

    if (action === 'restore') {
      await prisma.company.update({
        where: { id },
        data: { 
          archived: false,
          archivedAt: null,
          archivedBy: null
        }
      });
      return NextResponse.json({ success: true, restored: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Update company error:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}
