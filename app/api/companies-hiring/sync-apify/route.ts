import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

const ACTOR_MAP: Record<string, string> = {
  'LinkedIn Jobs': 'rockybilly/linkedin-jobs-scraper',
  'Indeed Jobs': 'misnomer/indeed-scraper',
  'Google Jobs': 'ludovic/google-jobs-scraper',
  'Remote Jobs': 'max/remote-jobs-scraper',
  'World Jobs': 'worldjobs/scraper'
};

export async function POST(req: Request) {
  try {
    // 1. Backend validation
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
    if (!APIFY_TOKEN) {
      return NextResponse.json({ success: false, message: 'APIFY_API_TOKEN is not configured in the server environment.' }, { status: 500 });
    }

    const body = await req.json();
    const { source, keyword, location, country, maxResults } = body;

    if (!source || !keyword) {
      return NextResponse.json({ success: false, message: 'Source and keyword are required.' }, { status: 400 });
    }

    const actorId = ACTOR_MAP[source];
    if (!actorId) {
      return NextResponse.json({ success: false, message: 'Invalid source selected.' }, { status: 400 });
    }

    // Prepare Apify input payload
    const apifyInput = {
      keyword,
      location: location || '',
      country: country !== 'Worldwide' ? country : '',
      maxItems: parseInt(maxResults) || 25,
    };

    // 2. Call Apify (run-sync-get-dataset-items)
    // Using a 120s timeout expectation. This could timeout Vercel hobby tiers, but this is a SaaS app running in its own environment.
    const apifyUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
    
    const apifyRes = await fetch(apifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apifyInput)
    });

    if (!apifyRes.ok) {
      const errorText = await apifyRes.text();
      return NextResponse.json({ success: false, message: `Apify Actor execution failed: ${apifyRes.statusText}`, error: errorText }, { status: 500 });
    }

    const datasetItems = await apifyRes.json();
    
    if (!Array.isArray(datasetItems) || datasetItems.length === 0) {
      return NextResponse.json({
        success: true,
        jobsFound: 0,
        companiesFound: 0,
        companiesCreated: 0,
        companiesUpdated: 0,
        duplicatesSkipped: 0,
        message: 'Apify run succeeded but no jobs were found.'
      });
    }

    // 3. Normalize and Deduplicate
    const companiesMap = new Map<string, any>(); // Map of normalizedCompanyName -> company object
    let duplicatesSkipped = 0;
    const allJobsToUpsert: any[] = [];

    for (const item of datasetItems) {
      // Normalize common scraper output formats
      const companyName = item.companyName || item.company || 'Unknown Company';
      const jobTitle = item.title || item.position || 'Unknown Role';
      const jobLocation = item.location || item.city || '';
      const jobUrl = item.url || item.applicationUrl || item.link || '';
      const externalId = item.id || item.externalId || crypto.createHash('md5').update(`${companyName}-${jobTitle}-${jobLocation}`).digest('hex');
      
      const normalizedCompanyName = companyName.trim().toUpperCase();

      // Check for global duplicates locally using externalId
      const existingJob = await prisma.job.findUnique({
        where: { externalId }
      });

      if (existingJob) {
        duplicatesSkipped++;
        continue;
      }

      // Infer work mode
      let workMode = 'On-site';
      const textToScan = `${jobTitle} ${jobLocation} ${item.description || ''}`.toLowerCase();
      if (textToScan.includes('remote') || textToScan.includes('work from home')) {
        workMode = 'Remote';
      } else if (textToScan.includes('hybrid')) {
        workMode = 'Hybrid';
      }

      const jobRecord = {
        externalId,
        source: source,
        title: jobTitle,
        category: item.category || 'Uncategorized',
        description: item.description || '',
        location: jobLocation,
        country: country !== 'Worldwide' ? country : '',
        workMode,
        applicationUrl: jobUrl,
        companyWebsite: item.companyWebsite || '',
        datePosted: item.postedAt ? new Date(item.postedAt) : new Date(),
        rawData: JSON.stringify(item)
      };

      if (!companiesMap.has(normalizedCompanyName)) {
        companiesMap.set(normalizedCompanyName, {
          name: companyName,
          source: source,
          location: jobLocation, // Primary location fallback
          country: country !== 'Worldwide' ? country : '',
          website: item.companyWebsite || '',
          jobs: []
        });
      }

      companiesMap.get(normalizedCompanyName).jobs.push(jobRecord);
    }

    // 4. Save to Database
    let companiesCreated = 0;
    let companiesUpdated = 0;
    let totalJobsInserted = 0;

    for (const [normalizedName, companyData] of Array.from(companiesMap.entries())) {
      // Find existing company by name
      let company = await prisma.company.findFirst({
        where: { name: { equals: companyData.name, mode: 'insensitive' } }
      });

      if (!company) {
        // Create new company
        company = await prisma.company.create({
          data: {
            name: companyData.name,
            source: companyData.source,
            location: companyData.location,
            country: companyData.country,
            website: companyData.website,
            activeJobPostCount: companyData.jobs.length,
            latestPostingDate: new Date(),
          }
        });
        companiesCreated++;
      } else {
        // Update existing company
        company = await prisma.company.update({
          where: { id: company.id },
          data: {
            activeJobPostCount: company.activeJobPostCount + companyData.jobs.length,
            latestPostingDate: new Date()
          }
        });
        companiesUpdated++;
      }

      // Insert all non-duplicate jobs linked to this company
      for (const job of companyData.jobs) {
        await prisma.job.create({
          data: {
            companyId: company.id,
            externalId: job.externalId,
            source: job.source,
            title: job.title,
            category: job.category,
            description: job.description,
            location: job.location,
            country: job.country,
            workMode: job.workMode,
            applicationUrl: job.applicationUrl,
            companyWebsite: job.companyWebsite,
            datePosted: job.datePosted,
            rawData: job.rawData
          }
        });
        totalJobsInserted++;
      }
    }

    return NextResponse.json({
      success: true,
      jobsFound: totalJobsInserted,
      companiesFound: companiesMap.size,
      companiesCreated,
      companiesUpdated,
      duplicatesSkipped,
      message: 'Apify job data synced successfully.'
    });

  } catch (error: any) {
    console.error('Apify sync error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error during Apify sync.' }, { status: 500 });
  }
}
