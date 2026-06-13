import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { 
      q, category, country, city, region, jobTitle, skill, workMode, jobType,
      hiringActivity, hiringDemand, postedWithin, minActiveJobPosts, maxActiveJobPosts,
      provider, hasWebsite, exactVacanciesDisclosed, companyStatus, addedToLeads, addedToCampaign,
      selectedIds // If provided, ignore filters and just export these
    } = body;

    const where: any = {};

    if (selectedIds && Array.isArray(selectedIds) && selectedIds.length > 0) {
      where.id = { in: selectedIds };
    } else {
      if (companyStatus === 'Active') where.archived = false;
      else if (companyStatus === 'Archived') where.archived = true;

      if (hasWebsite === 'Yes') where.AND = [{ website: { not: null } }, { website: { not: '' } }];
      else if (hasWebsite === 'No') where.OR = [{ website: null }, { website: '' }];
      
      if (provider && provider !== 'All') where.source = { equals: provider, mode: 'insensitive' };

      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
          { website: { contains: q, mode: 'insensitive' } },
          {
            jobs: {
              some: {
                OR: [
                  { title: { contains: q, mode: 'insensitive' } },
                  { category: { contains: q, mode: 'insensitive' } },
                  { requiredSkills: { contains: q, mode: 'insensitive' } },
                  { preferredSkills: { contains: q, mode: 'insensitive' } }
                ]
              }
            }
          }
        ];
      }

      const jobSome: any = {};
      let hasJobFilter = false;

      if (country) { jobSome.country = { equals: country, mode: 'insensitive' }; hasJobFilter = true; }
      if (city) { jobSome.city = { equals: city, mode: 'insensitive' }; hasJobFilter = true; }
      if (region) { jobSome.region = { equals: region, mode: 'insensitive' }; hasJobFilter = true; }
      if (category && category !== 'All Categories') { jobSome.category = { equals: category, mode: 'insensitive' }; hasJobFilter = true; }
      if (jobTitle) { jobSome.title = { contains: jobTitle, mode: 'insensitive' }; hasJobFilter = true; }
      if (skill) {
        jobSome.OR = [
          { requiredSkills: { contains: skill, mode: 'insensitive' } },
          { preferredSkills: { contains: skill, mode: 'insensitive' } }
        ];
        hasJobFilter = true;
      }
      if (workMode && workMode !== 'Any') { jobSome.workMode = { equals: workMode, mode: 'insensitive' }; hasJobFilter = true; }
      if (jobType && jobType !== 'Any') { jobSome.jobType = { equals: jobType, mode: 'insensitive' }; hasJobFilter = true; }
      if (exactVacanciesDisclosed === 'Yes') { jobSome.vacancies = { not: null }; hasJobFilter = true; } 
      else if (exactVacanciesDisclosed === 'No') { jobSome.vacancies = null; hasJobFilter = true; }

      if (postedWithin && postedWithin !== 'Any time') {
        const dateLimit = new Date();
        if (postedWithin === 'Last 24 hours') dateLimit.setDate(dateLimit.getDate() - 1);
        else if (postedWithin === 'Last 3 days') dateLimit.setDate(dateLimit.getDate() - 3);
        else if (postedWithin === 'Last 7 days') dateLimit.setDate(dateLimit.getDate() - 7);
        else if (postedWithin === 'Last 14 days') dateLimit.setDate(dateLimit.getDate() - 14);
        else if (postedWithin === 'Last 30 days') dateLimit.setDate(dateLimit.getDate() - 30);
        else if (postedWithin === 'Last 90 days') dateLimit.setDate(dateLimit.getDate() - 90);
        jobSome.datePosted = { gte: dateLimit };
        hasJobFilter = true;
      }

      if (hasJobFilter) where.jobs = { some: jobSome };
      else where.jobs = { some: {} };

      if (hiringActivity && hiringActivity !== 'All') {
        if (hiringActivity === 'High Activity' || hiringActivity === 'High') where.activeJobPostCount = { gte: 10 };
        else if (hiringActivity === 'Medium Activity' || hiringActivity === 'Medium') where.activeJobPostCount = { gte: 4, lt: 10 };
        else if (hiringActivity === 'Low Activity' || hiringActivity === 'Low') where.activeJobPostCount = { lt: 4 };
      }

      if (hiringDemand && hiringDemand !== 'All') {
        where.hiringDemand = { equals: hiringDemand, mode: 'insensitive' };
      }

      if (minActiveJobPosts > 0 || maxActiveJobPosts > 0) {
        where.activeJobPostCount = { ...where.activeJobPostCount };
        if (minActiveJobPosts > 0) where.activeJobPostCount.gte = minActiveJobPosts;
        if (maxActiveJobPosts > 0) where.activeJobPostCount.lte = maxActiveJobPosts;
      }

      if (addedToLeads === 'Yes') where.leads = { some: { userId: user.id } };
      else if (addedToLeads === 'No') where.leads = { none: { userId: user.id } };

      if (addedToCampaign === 'Yes') where.leads = { some: { userId: user.id, campaignLeads: { some: {} } } };
      else if (addedToCampaign === 'No') {
        if (addedToLeads === 'Yes') where.leads = { some: { userId: user.id, campaignLeads: { none: {} } } };
        else where.OR = [{ leads: { none: { userId: user.id } } }, { leads: { some: { userId: user.id, campaignLeads: { none: {} } } } }];
      }
    }

    const companies = await prisma.company.findMany({
      where,
      orderBy: { activeJobPostCount: 'desc' },
      take: 1000, // Limit export to 1000 rows to prevent timeouts on serverless
      include: {
        jobs: {
          select: { title: true, category: true, location: true, datePosted: true, vacancies: true }
        }
      }
    });

    const escapeCSV = (str: string | null | undefined) => {
      if (!str) return '""';
      const escaped = str.toString().replace(/"/g, '""');
      return `"${escaped}"`;
    };

    let csvContent = "Company Name,Industry,Website,Country,Locations,Active Job Posts Found,Posts in Last 7 Days,Posts in Last 30 Days,Job Categories,Job Titles,Latest Posting,Hiring Activity,Hiring Demand,Exact Vacancies Disclosed,Provider,AI Insight\n";

    companies.forEach(c => {
      const activeJobs = c.jobs;
      let recentPosts7Days = 0;
      let recentPosts30Days = 0;
      let latestPostingDate: Date | null = null;
      let companyVacancies = 0;
      
      const jobCategoriesSet = new Set<string>();
      const locationsSet = new Set<string>();
      const titlesSet = new Set<string>();

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      activeJobs.forEach(job => {
        if (job.vacancies) companyVacancies += job.vacancies;

        if (job.datePosted) {
          const postedDate = new Date(job.datePosted);
          if (postedDate >= sevenDaysAgo) recentPosts7Days++;
          if (postedDate >= thirtyDaysAgo) recentPosts30Days++;
          if (!latestPostingDate || postedDate > latestPostingDate) latestPostingDate = postedDate;
        }

        if (job.category) jobCategoriesSet.add(job.category);
        if (job.title) titlesSet.add(job.title);
        if (job.location) locationsSet.add(job.location);
      });

      let calculatedActivity = 'Low Activity';
      if (c.activeJobPostCount >= 10 || recentPosts7Days >= 5) calculatedActivity = 'High Activity';
      else if (c.activeJobPostCount >= 4 || recentPosts7Days >= 2) calculatedActivity = 'Medium Activity';

      csvContent += `${escapeCSV(c.name)},`;
      csvContent += `${escapeCSV(Array.from(jobCategoriesSet)[0] || '')},`;
      csvContent += `${escapeCSV(c.website)},`;
      csvContent += `${escapeCSV(c.country)},`;
      csvContent += `${escapeCSV(Array.from(locationsSet).join('; '))},`;
      csvContent += `${escapeCSV((c.activeJobPostCount > 0 ? c.activeJobPostCount : activeJobs.length).toString())},`;
      csvContent += `${escapeCSV((recentPosts7Days > 0 ? recentPosts7Days : ((c as any).recentJobPostCount7Days || 0)).toString())},`;
      csvContent += `${escapeCSV((recentPosts30Days > 0 ? recentPosts30Days : ((c as any).recentJobPostCount30Days || 0)).toString())},`;
      csvContent += `${escapeCSV(Array.from(jobCategoriesSet).join('; '))},`;
      csvContent += `${escapeCSV(Array.from(titlesSet).join('; '))},`;
      csvContent += `${escapeCSV(latestPostingDate ? (latestPostingDate as Date).toISOString() : ((c as any).latestPostingDate ? new Date((c as any).latestPostingDate).toISOString() : ''))},`;
      csvContent += `${escapeCSV(calculatedActivity)},`;
      csvContent += `${escapeCSV(c.hiringDemand || 'Low')},`;
      csvContent += `${escapeCSV(companyVacancies > 0 ? companyVacancies.toString() : '')},`;
      csvContent += `${escapeCSV(c.source)},`;
      csvContent += `${escapeCSV(c.aiHiringInsight)}\n`;
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="companies_hiring_export.csv"',
      },
    });

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export companies' }, { status: 500 });
  }
}
