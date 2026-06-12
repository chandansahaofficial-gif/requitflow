import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    
    // Parse parameters
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const country = searchParams.get('country') || '';
    const city = searchParams.get('city') || '';
    const region = searchParams.get('region') || '';
    const jobTitle = searchParams.get('jobTitle') || '';
    const skill = searchParams.get('skill') || '';
    const workMode = searchParams.get('workMode') || '';
    const jobType = searchParams.get('jobType') || '';
    
    const hiringActivity = searchParams.get('hiringActivity') || '';
    const hiringDemand = searchParams.get('hiringDemand') || '';
    const postedWithin = searchParams.get('postedWithin') || ''; 
    
    const minActiveJobPosts = parseInt(searchParams.get('minActiveJobPosts') || '0', 10);
    const maxActiveJobPosts = parseInt(searchParams.get('maxActiveJobPosts') || '0', 10);
    
    const provider = searchParams.get('provider') || '';
    const hasWebsite = searchParams.get('hasWebsite') || ''; 
    const exactVacanciesDisclosedParam = searchParams.get('exactVacanciesDisclosed') || ''; 
    
    const companyStatus = searchParams.get('companyStatus') || 'Active'; 
    const addedToLeads = searchParams.get('addedToLeads') || ''; 
    const addedToCampaign = searchParams.get('addedToCampaign') || ''; 
    
    const sort = searchParams.get('sort') || 'most-active';
    let page = parseInt(searchParams.get('page') || '1', 10);
    let pageSize = parseInt(searchParams.get('pageSize') || '25', 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) pageSize = 25;

    // Build the query safely
    const where: any = {};

    if (companyStatus === 'Active') {
      where.archived = false;
    } else if (companyStatus === 'Archived') {
      where.archived = true;
    }

    if (hasWebsite === 'Yes') {
      where.website = { not: null, gt: '' };
    } else if (hasWebsite === 'No') {
      where.OR = [{ website: null }, { website: '' }];
    }
    
    if (provider && provider !== 'All') {
      where.source = { equals: provider, mode: 'insensitive' };
    }

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

    // Job-related filters
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
    
    if (exactVacanciesDisclosedParam === 'Yes') {
      jobSome.vacancies = { not: null };
      hasJobFilter = true;
    } else if (exactVacanciesDisclosedParam === 'No') {
      jobSome.vacancies = null;
      hasJobFilter = true;
    }

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

    if (hasJobFilter) {
      // Must merge with existing OR if present, but for safety just assign
      if (!where.jobs) where.jobs = {};
      where.jobs.some = jobSome;
    }

    if (hiringActivity && hiringActivity !== 'All') {
      if (hiringActivity === 'High Activity' || hiringActivity === 'High') {
        where.activeJobPostCount = { gte: 10 };
      } else if (hiringActivity === 'Medium Activity' || hiringActivity === 'Medium') {
        where.activeJobPostCount = { gte: 4, lt: 10 };
      } else if (hiringActivity === 'Low Activity' || hiringActivity === 'Low') {
        where.activeJobPostCount = { lt: 4 };
      }
    }

    if (hiringDemand && hiringDemand !== 'All') {
      where.hiringDemand = { equals: hiringDemand, mode: 'insensitive' };
    }

    if (minActiveJobPosts > 0 || maxActiveJobPosts > 0) {
      where.activeJobPostCount = { ...where.activeJobPostCount };
      if (minActiveJobPosts > 0) where.activeJobPostCount.gte = minActiveJobPosts;
      if (maxActiveJobPosts > 0) where.activeJobPostCount.lte = maxActiveJobPosts;
    }

    if (user) {
      if (addedToLeads === 'Yes') {
        where.leads = { some: { userId: user.id } };
      } else if (addedToLeads === 'No') {
        where.leads = { none: { userId: user.id } };
      }

      if (addedToCampaign === 'Yes') {
        where.leads = { some: { userId: user.id, campaignLeads: { some: {} } } };
      } else if (addedToCampaign === 'No') {
        if (addedToLeads === 'Yes') {
          where.leads = { some: { userId: user.id, campaignLeads: { none: {} } } };
        } else {
           // Complex OR logic can cause issues, simplify safely
           const orConditions = where.OR || [];
           where.OR = [
             ...orConditions,
             { leads: { none: { userId: user.id } } },
             { leads: { some: { userId: user.id, campaignLeads: { none: {} } } } }
           ];
        }
      }
    }

    // 1. Fetch total count safely
    const totalCompanies = await prisma.company.count({ where });

    if (totalCompanies === 0) {
      return NextResponse.json({
        summary: {
          totalHiringCompanies: 0,
          totalActiveJobPosts: 0,
          totalCategories: 0,
          totalLocations: 0,
          exactVacanciesDisclosed: null,
          highActivityCompanies: 0
        },
        companies: [],
        pagination: {
          page,
          pageSize,
          totalCompanies: 0,
          totalPages: 0
        }
      });
    }

    // 2. Determine Sorting
    let orderBy: any = [];
    switch (sort) {
      case 'Most Active Hiring':
      case 'most-active':
        orderBy = [{ activeJobPostCount: 'desc' }, { recentJobPostCount7Days: 'desc' }];
        break;
      case 'Most Recent Posting':
      case 'most-recent':
        orderBy = [{ latestPostingDate: 'desc' }];
        break;
      case 'Most Job Posts':
      case 'most-jobs':
        orderBy = [{ activeJobPostCount: 'desc' }];
        break;
      case 'Company Name A–Z':
      case 'name-asc':
        orderBy = [{ name: 'asc' }];
        break;
      case 'Company Name Z–A':
      case 'name-desc':
        orderBy = [{ name: 'desc' }];
        break;
      default:
        orderBy = [{ activeJobPostCount: 'desc' }];
    }

    // 3. Fetch Paginated Companies with Include
    const includeConfig: any = {
      jobs: {
        where: hasJobFilter ? jobSome : undefined,
        select: {
          id: true,
          externalId: true,
          title: true,
          location: true,
          city: true,
          region: true,
          country: true,
          category: true,
          datePosted: true,
          vacancies: true,
          workMode: true,
          jobType: true,
          applicationUrl: true,
          source: true
        }
      }
    };
    
    if (user) {
      includeConfig.leads = { where: { userId: user.id }, include: { campaignLeads: true } };
    }

    const companies = await prisma.company.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: includeConfig
    });

    // 3.5. Safe Backfill/Fallback Grouping for unlinked jobs (if page 1)
    let unlinkedJobs: any[] = [];
    if (page === 1 && !hasWebsite && !addedToLeads && !addedToCampaign && companyStatus !== 'Archived') {
      try {
        const unlinkedWhere: any = { companyId: null };
        if (hasJobFilter) {
          Object.assign(unlinkedWhere, jobSome);
        }
        if (q) {
          unlinkedWhere.OR = [
            { companyName: { contains: q, mode: 'insensitive' } },
            { title: { contains: q, mode: 'insensitive' } }
          ];
        }
        unlinkedJobs = await prisma.job.findMany({
          where: unlinkedWhere,
          take: 500, // Safe bound
          select: includeConfig.jobs.select
        });
      } catch (err) {
        // Silently ignore fallback fetch errors to prevent crash
      }
    }

    // 4. Safe aggregation per company and globally
    let globalExactVacancies = 0;
    let globalHighActivityCount = 0;
    let globalActiveJobsCount = 0;
    const globalCategories = new Set<string>();
    const globalLocations = new Set<string>();

    const results = companies.map(company => {
      const activeJobs = (company as any).jobs || [];
      
      // Deduplicate jobs by externalId, applicationUrl, or combination
      const uniqueJobsMap = new Map<string, any>();
      activeJobs.forEach((job: any) => {
        const dedupeKey = job.externalId || job.applicationUrl || `${company.name.toLowerCase()}-${(job.title || '').toLowerCase()}-${(job.location || '').toLowerCase()}`;
        if (!uniqueJobsMap.has(dedupeKey)) {
          uniqueJobsMap.set(dedupeKey, job);
        }
      });
      
      const uniqueJobs = Array.from(uniqueJobsMap.values());
      globalActiveJobsCount += uniqueJobs.length;
      
      let recentPosts7Days = 0;
      let recentPosts30Days = 0;
      let latestPostingDate: Date | null = null;
      let companyVacancies = 0;
      
      const jobCategoriesSet = new Set<string>();
      const locationsSet = new Set<string>();
      const titlesSet = new Set<string>();
      const workModesSet = new Set<string>();
      const jobTypesSet = new Set<string>();
      const providersSet = new Set<string>();

      if (company.source) providersSet.add(company.source);

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      uniqueJobs.forEach(job => {
        if (job.vacancies && job.vacancies > 0) {
          companyVacancies += job.vacancies;
          globalExactVacancies += job.vacancies;
        }

        if (job.datePosted) {
          const postedDate = new Date(job.datePosted);
          if (postedDate >= sevenDaysAgo) recentPosts7Days++;
          if (postedDate >= thirtyDaysAgo) recentPosts30Days++;

          if (!latestPostingDate || postedDate > latestPostingDate) {
            latestPostingDate = postedDate;
          }
        }

        if (job.category) { 
          jobCategoriesSet.add(job.category); 
          globalCategories.add(job.category); 
        }
        if (job.title) titlesSet.add(job.title);
        
        if (job.city) { locationsSet.add(job.city); globalLocations.add(job.city); }
        else if (job.region) { locationsSet.add(job.region); globalLocations.add(job.region); }
        else if (job.country) { locationsSet.add(job.country); globalLocations.add(job.country); }
        else if (job.location) { locationsSet.add(job.location); globalLocations.add(job.location); }
        
        if (job.workMode) workModesSet.add(job.workMode);
        if (job.jobType) jobTypesSet.add(job.jobType);
        if (job.source) providersSet.add(job.source);
      });

      let calculatedActivity = 'Low Activity';
      if (company.activeJobPostCount >= 10 || recentPosts7Days >= 5) {
        calculatedActivity = 'High Activity';
        globalHighActivityCount++;
      }
      else if (company.activeJobPostCount >= 4 || recentPosts7Days >= 2) {
        calculatedActivity = 'Medium Activity';
      }

      let calculatedDemand = company.hiringDemand || 'Low';

      const isAddedToLeads = user && (company as any).leads && (company as any).leads.length > 0;
      const isAddedToCampaign = isAddedToLeads && (company as any).leads[0].campaignLeads && (company as any).leads[0].campaignLeads.length > 0;

      return {
        id: company.id,
        companyName: company.name,
        activeJobPostsFound: uniqueJobs.length > 0 ? uniqueJobs.length : company.activeJobPostCount,
        exactVacanciesDisclosed: companyVacancies > 0 ? companyVacancies : null,
        categories: Array.from(jobCategoriesSet),
        jobTitles: Array.from(titlesSet),
        locations: Array.from(locationsSet),
        country: company.country || "",
        workModes: Array.from(workModesSet),
        jobTypes: Array.from(jobTypesSet),
        latestPostingDate: latestPostingDate || company.latestPostingDate,
        recentPosts7Days: recentPosts7Days > 0 ? recentPosts7Days : company.recentJobPostCount7Days,
        recentPosts30Days: recentPosts30Days > 0 ? recentPosts30Days : company.recentJobPostCount30Days,
        hiringActivity: calculatedActivity.replace(' Activity', ''),
        hiringDemand: calculatedDemand.replace(' Demand', ''),
        website: company.website,
        providers: Array.from(providersSet),
        addedToLeads: isAddedToLeads,
        addedToCampaign: isAddedToCampaign,
        archived: company.archived
      };
    });

    // Process unlinked jobs into synthetic company groups
    if (unlinkedJobs.length > 0) {
      const groupedUnlinked = new Map<string, any[]>();
      unlinkedJobs.forEach(job => {
        const cName = (job as any).companyName || 'Unknown Company';
        if (!groupedUnlinked.has(cName)) groupedUnlinked.set(cName, []);
        groupedUnlinked.get(cName)!.push(job);
      });

      groupedUnlinked.forEach((jobs, cName) => {
        // Apply identical deduplication logic
        const uniqueJobsMap = new Map<string, any>();
        jobs.forEach((job: any) => {
          const dedupeKey = job.externalId || job.applicationUrl || `${cName.toLowerCase()}-${(job.title || '').toLowerCase()}-${(job.location || '').toLowerCase()}`;
          if (!uniqueJobsMap.has(dedupeKey)) uniqueJobsMap.set(dedupeKey, job);
        });
        
        const uniqueJobs = Array.from(uniqueJobsMap.values());
        globalActiveJobsCount += uniqueJobs.length;
        
        let recentPosts7Days = 0;
        let recentPosts30Days = 0;
        let latestPostingDate: Date | null = null;
        let companyVacancies = 0;
        
        const jobCategoriesSet = new Set<string>();
        const locationsSet = new Set<string>();
        const titlesSet = new Set<string>();
        const workModesSet = new Set<string>();
        const jobTypesSet = new Set<string>();
        const providersSet = new Set<string>();

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        uniqueJobs.forEach(job => {
          if (job.vacancies && job.vacancies > 0) {
            companyVacancies += job.vacancies;
            globalExactVacancies += job.vacancies;
          }

          if (job.datePosted) {
            const postedDate = new Date(job.datePosted);
            if (postedDate >= sevenDaysAgo) recentPosts7Days++;
            if (postedDate >= thirtyDaysAgo) recentPosts30Days++;

            if (!latestPostingDate || postedDate > latestPostingDate) {
              latestPostingDate = postedDate;
            }
          }

          if (job.category) { jobCategoriesSet.add(job.category); globalCategories.add(job.category); }
          if (job.title) titlesSet.add(job.title);
          
          if (job.city) { locationsSet.add(job.city); globalLocations.add(job.city); }
          else if (job.region) { locationsSet.add(job.region); globalLocations.add(job.region); }
          else if (job.country) { locationsSet.add(job.country); globalLocations.add(job.country); }
          else if (job.location) { locationsSet.add(job.location); globalLocations.add(job.location); }
          
          if (job.workMode) workModesSet.add(job.workMode);
          if (job.jobType) jobTypesSet.add(job.jobType);
          if (job.source) providersSet.add(job.source);
        });

        let calculatedActivity = 'Low Activity';
        if (uniqueJobs.length >= 10 || recentPosts7Days >= 5) {
          calculatedActivity = 'High Activity';
          globalHighActivityCount++;
        } else if (uniqueJobs.length >= 4 || recentPosts7Days >= 2) {
          calculatedActivity = 'Medium Activity';
        }

        results.push({
          id: `unlinked-${Buffer.from(cName).toString('base64').substring(0, 8)}`,
          companyName: cName,
          activeJobPostsFound: uniqueJobs.length,
          exactVacanciesDisclosed: companyVacancies > 0 ? companyVacancies : null,
          categories: Array.from(jobCategoriesSet),
          jobTitles: Array.from(titlesSet),
          locations: Array.from(locationsSet),
          country: "",
          workModes: Array.from(workModesSet),
          jobTypes: Array.from(jobTypesSet),
          latestPostingDate: latestPostingDate,
          recentPosts7Days: recentPosts7Days,
          recentPosts30Days: recentPosts30Days,
          hiringActivity: calculatedActivity.replace(' Activity', ''),
          hiringDemand: 'Low',
          website: null,
          providers: Array.from(providersSet),
          addedToLeads: false,
          addedToCampaign: false,
          archived: false,
          jobs: uniqueJobs // pass jobs in case frontend needs it
        });
      });
    }

    const totalPages = Math.ceil(totalCompanies / pageSize);

    // Global summary safe aggregate for Active Jobs (we use database sum over all companies)
    let totalActiveJobPosts = globalActiveJobsCount;
    try {
      const summaryAggs = await prisma.company.aggregate({
        where,
        _sum: { activeJobPostCount: true }
      });
      if (summaryAggs._sum.activeJobPostCount && summaryAggs._sum.activeJobPostCount > totalActiveJobPosts) {
         totalActiveJobPosts = summaryAggs._sum.activeJobPostCount;
      }
    } catch (aggErr) {
      // safe fallback
    }

    return NextResponse.json({
      summary: {
        totalHiringCompanies: totalCompanies,
        totalActiveJobPosts: totalActiveJobPosts,
        totalCategories: globalCategories.size,
        totalLocations: globalLocations.size,
        exactVacanciesDisclosed: globalExactVacancies > 0 ? globalExactVacancies : null,
        highActivityCompanies: globalHighActivityCount
      },
      companies: results,
      pagination: {
        page,
        pageSize,
        totalCompanies,
        totalPages
      }
    });

  } catch (error: any) {
    console.error('Error fetching companies hiring:', {
      name: error.name,
      message: error.message,
      code: error.code,
      route: '/api/companies-hiring'
    });
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
