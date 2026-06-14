import crypto from 'crypto';

export function detectCategory(title: string | null | undefined, description: string | null | undefined): string {
  const text = ((title || '') + ' ' + (description || '')).toLowerCase();

  if (text.match(/developer|engineer|frontend|backend|full stack|software|programmer/)) return 'Software Engineering';
  if (text.match(/data scientist|data analyst|machine learning|ai|ml|business intelligence/)) return 'Data / AI / ML';
  if (text.match(/sales|account executive|business development|bdr|sdr/)) return 'Sales';
  if (text.match(/marketing|seo|content|ads|growth|social media/)) return 'Marketing';
  if (text.match(/recruiter|talent acquisition|hr|human resources/)) return 'HR / Recruitment';
  if (text.match(/support|customer success|chat support|customer service/)) return 'Customer Support';
  if (text.match(/intern|fresher|trainee|graduate/)) return 'Internship / Fresher';
  if (text.match(/finance|accountant|accounts|payroll/)) return 'Finance';
  if (text.match(/designer|ui|ux|graphic/)) return 'Design';
  if (text.match(/product manager|product owner/)) return 'Product Management';
  if (text.match(/nurse|doctor|healthcare|medical/)) return 'Healthcare';
  if (text.match(/teacher|tutor|education|faculty/)) return 'Education';

  return 'Other';
}

export function detectRemoteType(title: string | null | undefined, location: string | null | undefined, workMode: string | null | undefined, description: string | null | undefined): string {
  const text = ((title || '') + ' ' + (location || '') + ' ' + (workMode || '') + ' ' + (description || '')).toLowerCase();

  if (text.match(/remote|work from home|worldwide/)) return 'REMOTE';
  if (text.match(/hybrid/)) return 'HYBRID';
  if (text.match(/on-site|onsite|office/)) return 'ONSITE';

  return 'UNKNOWN';
}

export function generateDescriptionHash(description: string | null | undefined): string | null {
  if (!description) return null;
  return crypto.createHash('sha256').update(description).digest('hex');
}

export function normalizeApifyJob(job: any, defaultSource: string): any {
  // Extract Company Name
  const companyName = job.companyName || job.company || job.company_name || job.hiringOrganization?.name || job.organization || job.employer || 'Unknown Company';
  const normalizedCompanyName = companyName.trim().toLowerCase();

  // Extract Title
  const title = job.title || job.jobTitle || job.job_title || job.position || job.role || 'Unknown Title';

  // Extract Location
  const location = job.location || job.jobLocation?.address?.addressLocality || job.address || job.city || job.country || 'Unknown Location';
  const city = job.city || job.jobLocation?.address?.addressLocality || null;
  const country = job.country || job.jobLocation?.address?.addressCountry || null;

  // URLs
  const applyUrl = job.applyUrl || job.url || job.jobUrl || job.link || job.applicationUrl || null;

  // Description
  const description = job.description || job.jobDescription || job.text || job.summary || null;

  // Dates
  const postedAtRaw = job.postedAt || job.postedDate || job.datePosted || job.publishedAt || job.createdAt || null;
  let postedAt = null;
  if (postedAtRaw) {
    postedAt = new Date(postedAtRaw);
    if (isNaN(postedAt.getTime())) {
      postedAt = null;
    }
  }

  // Derive additional fields
  const category = detectCategory(title, description);
  const remoteType = detectRemoteType(title, location, job.workplaceType || job.workMode, description);

  // Exact headcount
  let exactHeadcount = null;
  if (description) {
    const textToSearch = (description + ' ' + title).toLowerCase();
    const match = textToSearch.match(/(\d+)\s+(openings|candidates|positions available|vacancies|hiring\s+candidates)/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) exactHeadcount = num;
    }
  }

  return {
    companyName: companyName.trim(),
    normalizedCompanyName,
    title: title.trim(),
    category,
    location: location.trim(),
    city: city ? city.trim() : null,
    country: country ? country.trim() : null,
    remoteType,
    employmentType: job.employmentType || null,
    salaryMin: job.salaryMin || job.baseSalary?.value?.minValue || null,
    salaryMax: job.salaryMax || job.baseSalary?.value?.maxValue || null,
    currency: job.currency || job.baseSalary?.currency || null,
    applyUrl,
    description,
    descriptionHash: generateDescriptionHash(description),
    postedAt,
    source: defaultSource,
    sourceJobId: job.sourceJobId || job.id || job.job_id || null,
    exactHeadcount
  };
}
