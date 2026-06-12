import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAdzunaCountryCode, normalizeAdzunaJob } from '@/lib/job-mapping';
import { searchJoobleJobs, normalizeJoobleJob, removeDuplicateJobs } from '@/lib/jooble';
import { prisma } from '@/lib/prisma';
import { generateText } from '@/services/openrouter';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      country, 
      jobTitle, 
      category, 
      location, 
      page = 1, 
      resultsPerPage = 25,
      jobType,
      salaryMin,
      salaryMax,
      datePosted
    } = body;

    let providerUsed = 'Jooble';
    let rawJobs = [];
    let normalizedJobs = [];
    let totalResults = 0;

    // 1. Try Jooble
    try {
      const joobleData = await searchJoobleJobs(body);
      rawJobs = joobleData.jobs || [];
      totalResults = joobleData.totalCount || rawJobs.length;
      normalizedJobs = rawJobs.map(normalizeJoobleJob);
    } catch (joobleError) {
      console.warn("Jooble search failed, falling back to Adzuna:", joobleError);
      
      // 2. Fallback to Adzuna
      providerUsed = 'Adzuna';
      const countryCode = getAdzunaCountryCode(country || process.env.ADZUNA_DEFAULT_COUNTRY || 'gb');
      if (!countryCode) {
        return NextResponse.json({ error: 'Job search is not available for the selected country.' }, { status: 400 });
      }

      const appId = process.env.ADZUNA_APP_ID;
      const appKey = process.env.ADZUNA_APP_KEY;

      if (!appId || !appKey) {
         throw new Error("Both Jooble and Adzuna failed/missing credentials.");
      }
      
      const baseUrl = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}`;
      const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        results_per_page: resultsPerPage.toString(),
        sort_by: 'date',
      });

      if (jobTitle) params.append('what', jobTitle);
      if (location) params.append('where', location);
      if (category) params.append('category', category);
      if (salaryMin) params.append('salary_min', salaryMin.toString());
      if (salaryMax) params.append('salary_max', salaryMax.toString());
      if (jobType === 'Full-time') params.append('full_time', '1');
      if (jobType === 'Part-time') params.append('part_time', '1');
      if (jobType === 'Contract') params.append('contract', '1');
      if (jobType === 'Permanent') params.append('permanent', '1');

      if (datePosted === 'Last 24 hours') params.append('max_days_old', '1');
      else if (datePosted === 'Last 3 days') params.append('max_days_old', '3');
      else if (datePosted === 'Last 7 days') params.append('max_days_old', '7');
      else if (datePosted === 'Last 14 days') params.append('max_days_old', '14');
      else if (datePosted === 'Last 30 days') params.append('max_days_old', '30');

      const apiUrl = `${baseUrl}?${params.toString()}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Adzuna API Error: ' + response.statusText);
      }
      const data = await response.json();
      rawJobs = data.results || [];
      totalResults = data.count || 0;
      normalizedJobs = rawJobs.map((j: any) => normalizeAdzunaJob(j));
    }

    // Deduplicate
    normalizedJobs = removeDuplicateJobs(normalizedJobs);

    // Save history
    await prisma.jobSearchHistory.create({
      data: {
        userId: user.id,
        searchFilters: JSON.stringify(body),
        countryCode: country || 'US',
        totalResults: totalResults,
      }
    });

    const finalJobs = [];
    
    // Process jobs, save to DB
    for (const job of normalizedJobs) {
      if (!job.applicationUrl) continue;
      
      // Upsert company
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
        } else {
          await prisma.company.update({
            where: { id: company.id },
            data: {
              activeJobPostCount: { increment: 1 },
              latestPostingDate: job.datePosted > (company.latestPostingDate || new Date(0)) ? job.datePosted : company.latestPostingDate
            }
          });
        }
        job.companyId = company.id;
      }

      // Check DB duplicate
      const existingJob = await prisma.job.findFirst({
        where: {
          OR: [
            { externalId: job.externalId },
            {
              companyId: job.companyId,
              title: job.title,
              location: job.location,
            }
          ]
        }
      });

      let savedJob;
      if (existingJob) {
        savedJob = await prisma.job.update({
          where: { id: existingJob.id },
          data: {
            lastSeenAt: new Date(),
            rawData: job.rawData,
          }
        });
      } else {
        savedJob = await prisma.job.create({
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
      }
      
      finalJobs.push({
        ...savedJob,
        company: company || { name: job.companyName || 'Unknown' }
      });
    }
    
    // AI Analysis (limited to top 3 to prevent timeouts)
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey && finalJobs.length > 0) {
       await Promise.all(finalJobs.slice(0, 3).map(async (job) => {
          try {
             if (job.description && !job.aiSummary) {
               const prompt = `Analyze this job posting:
Title: ${job.title}
Desc: ${job.description.substring(0, 1000)}

Please return a concise 2-sentence summary of the role and any core skills.`;
               const aiSummary = await generateText(openRouterKey, prompt, process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini');
               job.aiSummary = aiSummary;
               await prisma.job.update({
                  where: { id: job.id },
                  data: { aiSummary }
               });
             }
          } catch(e) {
             console.error("AI Analysis failed for job", job.id, e);
          }
       }));
    }

    return NextResponse.json({
      items: finalJobs,
      provider: providerUsed,
      page,
      pageSize: resultsPerPage,
      totalResults: totalResults,
      totalPages: Math.ceil(totalResults / resultsPerPage)
    });

  } catch (error: any) {
    console.error('Job Search Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
