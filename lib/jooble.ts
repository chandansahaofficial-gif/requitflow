export function getJoobleApiKey(): string | null {
  return process.env.JOOBLE_API_KEY || null;
}

export function mapCategoryToKeywords(category: string): string {
  if (!category) return '';
  const mapping: Record<string, string> = {
    'Software Development': 'software developer OR engineer OR programmer',
    'Marketing': 'marketing OR SEO OR social media',
    'Sales': 'sales OR business development OR account executive',
    'Design': 'designer OR UI OR UX OR graphic',
    'Data Science': 'data scientist OR data analyst OR machine learning',
    'Customer Support': 'customer support OR customer service OR technical support',
    'Finance': 'finance OR accountant OR financial analyst',
    'Human Resources': 'HR OR human resources OR recruiter',
  };
  return mapping[category] || category;
}

export async function searchJoobleJobs(filters: any): Promise<any> {
  const apiKey = getJoobleApiKey();
  if (!apiKey) {
    throw new Error('Jooble API key is missing. Please configure it in environment variables.');
  }

  // Jooble payload mapping
  const payload: any = {
    keywords: filters.keywords || filters.jobTitle || mapCategoryToKeywords(filters.category),
    location: filters.location || filters.country || '',
    page: filters.page || 1,
  };

  if (filters.resultsPerPage) {
    payload.resultonpage = filters.resultsPerPage;
  }
  
  if (filters.salaryMin) {
    payload.salary = filters.salaryMin;
  }

  const response = await fetch(`https://jooble.org/api/${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Jooble API Error: ${response.statusText}`);
  }

  return await response.json();
}

function extractVacancies(description: string): { vacancies: number | null, evidence: string, vacancyStatus: string } {
  if (!description) return { vacancies: null, evidence: '', vacancyStatus: "Not publicly disclosed" };
  
  // Strict regex to find explicit vacancy counts
  const regex = /\b(\d+)\s*(openings|positions available|vacancies|candidates)\b/i;
  const match = description.match(regex);
  
  if (match && match[1]) {
    const count = parseInt(match[1], 10);
    return {
      vacancies: count,
      evidence: match[0],
      vacancyStatus: "Publicly disclosed"
    };
  }

  const hiringRegex = /\bhiring\s*(\d+)\s*candidates\b/i;
  const hiringMatch = description.match(hiringRegex);
  
  if (hiringMatch && hiringMatch[1]) {
    const count = parseInt(hiringMatch[1], 10);
    return {
      vacancies: count,
      evidence: hiringMatch[0],
      vacancyStatus: "Publicly disclosed"
    };
  }

  const multipleRegex = /\b(multiple|several|various)\s*(openings|positions available|vacancies|candidates)\b/i;
  if (description.match(multipleRegex)) {
    return { vacancies: null, evidence: '', vacancyStatus: "Publicly disclosed, exact count unavailable" };
  }

  return { vacancies: null, evidence: '', vacancyStatus: "Not publicly disclosed" };
}

function generateHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

export function normalizeJoobleJob(job: any): any {
  const { vacancies, evidence, vacancyStatus } = extractVacancies(job.snippet || '');

  return {
    externalId: String(job.id),
    companyId: null,
    source: "Jooble",
    title: job.title || "Unknown Title",
    category: "Uncategorized", // Jooble doesn't provide direct category often
    description: job.snippet || "",
    location: job.location || "",
    city: "", // Jooble location is usually a single string
    region: "",
    country: "", 
    latitude: null,
    longitude: null,
    workMode: determineWorkMode(job.snippet, job.title),
    jobType: determineJobType(job.type),
    contractType: job.type || null,
    contractTime: null,
    salaryMin: job.salary ? parseFloat(job.salary) : null,
    salaryMax: null,
    salaryCurrency: "USD",
    salaryDisclosed: !!job.salary,
    requiredExperience: "Not disclosed",
    requiredSkills: "Not disclosed",
    preferredSkills: "Not disclosed",
    datePosted: job.updated ? new Date(job.updated) : new Date(),
    applicationUrl: job.link || "",
    companyWebsite: "",
    vacancies: vacancies,
    candidatesNeeded: vacancies,
    vacancyStatus: vacancyStatus,
    vacancyEvidence: evidence,
    hiringUrgency: "Medium",
    hiringDemand: "Medium",
    aiSummary: "",
    rawData: JSON.stringify(job),
    descriptionHash: generateHash(job.snippet || job.title || ""),
    // Include company name for downstream grouping
    companyName: job.company || "Unknown Company"
  };
}

function determineWorkMode(description: string = "", title: string = ""): string {
  const text = (description + " " + title).toLowerCase();
  if (text.includes("remote") || text.includes("work from home")) return "Remote";
  if (text.includes("hybrid")) return "Hybrid";
  if (text.includes("on-site") || text.includes("onsite") || text.includes("in office")) return "On-site";
  return "Not disclosed";
}

function determineJobType(type: string = ""): string {
  const t = type.toLowerCase();
  if (t.includes("full")) return "Full-time";
  if (t.includes("part")) return "Part-time";
  if (t.includes("contract")) return "Contract";
  if (t.includes("intern")) return "Internship";
  return "Not disclosed";
}

export function removeDuplicateJobs(jobs: any[]): any[] {
  const seen = new Set();
  return jobs.filter(job => {
    const key = job.externalId || (job.title + job.companyName + job.location);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function groupJobsByCompany(jobs: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  for (const job of jobs) {
    const companyName = job.companyName || job.company?.name || "Unknown Company";
    if (!groups[companyName]) {
      groups[companyName] = [];
    }
    groups[companyName].push(job);
  }
  return groups;
}

export function calculateHiringActivity(companyJobs: any[]): string {
  const activePosts = companyJobs.length;
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentPosts = companyJobs.filter(j => new Date(j.datePosted) >= sevenDaysAgo).length;

  if (activePosts >= 10 || recentPosts >= 5) {
    return "High";
  } else if (activePosts >= 4 || recentPosts >= 2) {
    return "Medium";
  } else if (activePosts >= 1) {
    return "Low";
  }
  return "None";
}

export function calculateHiringDemand(companyJobs: any[]): string {
  const activity = calculateHiringActivity(companyJobs);
  if (activity === "High") return "High Demand";
  if (activity === "Medium") return "Steady Demand";
  return "Low Demand";
}
