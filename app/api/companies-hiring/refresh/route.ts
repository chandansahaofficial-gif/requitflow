import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { searchJoobleJobs, normalizeJoobleJob, removeDuplicateJobs } from '@/lib/jooble';
import { getAdzunaCountryCode, normalizeAdzunaJob } from '@/lib/job-mapping';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { 
      q, category, country, city, region, jobTitle
    } = body;

    // Use current search filters to fetch data
    const searchParams = {
      jobTitle: jobTitle || q || undefined,
      category: category !== 'All Categories' ? category : undefined,
      country: country || undefined,
      location: city || region || undefined,
      resultsPerPage: 50,
      page: 1
    };

    let rawJobs = [];
    let normalizedJobs = [];

    // 1. Try Jooble
    try {
      const joobleData = await searchJoobleJobs(searchParams);
      rawJobs = joobleData.jobs || [];
      normalizedJobs = rawJobs.map(normalizeJoobleJob);
    } catch (joobleError) {
      console.warn("Jooble refresh failed, falling back to Adzuna:", joobleError);
      
      // 2. Fallback to Adzuna
      const countryCode = getAdzunaCountryCode(country || process.env.ADZUNA_DEFAULT_COUNTRY || 'gb');
      if (countryCode && process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
        const baseUrl = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1`;
        const params = new URLSearchParams({
          app_id: process.env.ADZUNA_APP_ID,
          app_key: process.env.ADZUNA_APP_KEY,
          results_per_page: '50',
          sort_by: 'date',
        });
        if (searchParams.jobTitle) params.append('what', searchParams.jobTitle);
        if (searchParams.location) params.append('where', searchParams.location);
        if (searchParams.category) params.append('category', searchParams.category);
        
        const apiUrl = `${baseUrl}?${params.toString()}`;
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          rawJobs = data.results || [];
          normalizedJobs = rawJobs.map((j: any) => normalizeAdzunaJob(j));
        }
      }
    }

    // Deduplicate from API response
    normalizedJobs = removeDuplicateJobs(normalizedJobs);

    let newJobsCount = 0;
    let updatedJobsCount = 0;
    let duplicatesSkippedCount = 0;
    let companiesRefreshed = new Set<string>();

    for (const job of normalizedJobs) {
      if (!job.applicationUrl) continue;
      
      let company = null;
      if (job.companyName) {
        company = await prisma.company.findFirst({
          where: { name: job.companyName }
        });
        
        if (!company) {
          company = await prisma.company.create({
            data: {
              name: job.companyName,
              country: job.country,
              location: job.location,
              activeJobPostCount: 1,
              latestPostingDate: job.datePosted
            }
          });
        }
        job.companyId = company.id;
        companiesRefreshed.add(company.id);
      }

      const existingJob = await prisma.job.findFirst({
        where: {
          OR: [
            { externalId: job.externalId },
            { companyId: job.companyId, title: job.title, location: job.location }
          ]
        }
      });

      if (existingJob) {
        // Did it change?
        if (existingJob.lastSeenAt < new Date(Date.now() - 1000 * 60 * 60)) {
           await prisma.job.update({
             where: { id: existingJob.id },
             data: { lastSeenAt: new Date() }
           });
           updatedJobsCount++;
        } else {
           duplicatesSkippedCount++;
        }
      } else {
        await prisma.job.create({
          data: {
             externalId: job.externalId,
             companyId: job.companyId,
             source: job.source,
             title: job.title,
             category: job.category,
             description: job.description,
             location: job.location,
             city: job.city,
             region: job.region,
             country: job.country,
             workMode: job.workMode,
             jobType: job.jobType,
             contractType: job.contractType,
             contractTime: job.contractTime,
             salaryMin: job.salaryMin,
             salaryMax: job.salaryMax,
             salaryCurrency: job.salaryCurrency,
             salaryDisclosed: job.salaryDisclosed,
             requiredExperience: job.requiredExperience,
             requiredSkills: job.requiredSkills,
             preferredSkills: job.preferredSkills,
             datePosted: job.datePosted,
             applicationUrl: job.applicationUrl,
             vacancies: job.vacancies,
             candidatesNeeded: job.candidatesNeeded,
             vacancyStatus: job.vacancyStatus,
             vacancyEvidence: job.vacancyEvidence,
             hiringUrgency: job.hiringUrgency,
             hiringDemand: job.hiringDemand,
             aiSummary: job.aiSummary,
             rawData: job.rawData,
             descriptionHash: job.descriptionHash
          }
        });
        newJobsCount++;
      }
    }

    // Now recalculate metrics for all companies touched
    for (const companyId of Array.from(companiesRefreshed)) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { jobs: { select: { datePosted: true } } }
      });
      if (!company) continue;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let recent7 = 0;
      let recent30 = 0;
      let latest: Date | null = null;

      company.jobs.forEach(j => {
        if (j.datePosted) {
          if (j.datePosted >= sevenDaysAgo) recent7++;
          if (j.datePosted >= thirtyDaysAgo) recent30++;
          if (!latest || j.datePosted > latest) latest = j.datePosted;
        }
      });

      let calculatedActivity = 'Low Activity';
      if (company.jobs.length >= 10 || recent7 >= 5) calculatedActivity = 'High Activity';
      else if (company.jobs.length >= 4 || recent7 >= 2) calculatedActivity = 'Medium Activity';

      let calculatedDemand = 'Low';
      if (company.jobs.length >= 10 && recent7 >= 3) calculatedDemand = 'High';
      else if (company.jobs.length >= 4) calculatedDemand = 'Medium';

      await prisma.company.update({
        where: { id: companyId },
        data: {
          activeJobPostCount: company.jobs.length,
          ...({ recentJobPostCount7Days: recent7 } as any),
          ...({ recentJobPostCount30Days: recent30 } as any),
          latestPostingDate: latest || company.latestPostingDate,
          hiringActivity: calculatedActivity,
          hiringDemand: calculatedDemand
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Refresh complete: ${normalizedJobs.length} jobs checked, ${newJobsCount} new jobs added, ${updatedJobsCount} updated, ${duplicatesSkippedCount} duplicates skipped, and ${companiesRefreshed.size} companies refreshed.`,
      stats: {
        checked: normalizedJobs.length,
        added: newJobsCount,
        updated: updatedJobsCount,
        skipped: duplicatesSkippedCount,
        companies: companiesRefreshed.size
      }
    });

  } catch (error: any) {
    console.error('Refresh API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to refresh data' }, { status: 500 });
  }
}
