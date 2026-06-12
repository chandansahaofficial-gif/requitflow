export const ADZUNA_COUNTRY_MAPPING: Record<string, string> = {
  "india": "in",
  "united states": "us",
  "usa": "us",
  "united kingdom": "gb",
  "uk": "gb",
  "canada": "ca",
  "australia": "au",
  "germany": "de",
  "france": "fr",
  "netherlands": "nl",
  "poland": "pl",
  "south africa": "za",
};

export function getAdzunaCountryCode(country: string): string | null {
  if (!country) return null;
  const normalizedCountry = country.toLowerCase().trim();
  return ADZUNA_COUNTRY_MAPPING[normalizedCountry] || null;
}

export function normalizeAdzunaJob(job: any, companyId?: string): any {
  const { vacancies, evidence, vacancyStatus } = extractVacancies(job.description || '');

  return {
    externalId: String(job.id),
    companyId: companyId || null,
    source: "Adzuna",
    title: job.title || "Unknown Title",
    category: job.category?.label || "Uncategorized",
    description: job.description || "",
    location: job.location?.display_name || "",
    city: job.location?.area?.[3] || job.location?.area?.[2] || "",
    region: job.location?.area?.[1] || "",
    country: job.location?.area?.[0] || "",
    latitude: job.latitude || null,
    longitude: job.longitude || null,
    workMode: determineWorkMode(job.description, job.title),
    jobType: determineJobType(job.contract_time, job.contract_type),
    contractType: job.contract_type || null,
    contractTime: job.contract_time || null,
    salaryMin: job.salary_min || null,
    salaryMax: job.salary_max || null,
    salaryCurrency: "USD", // Adzuna doesn't always provide currency directly; usually localized by country code.
    salaryDisclosed: !!(job.salary_min || job.salary_max),
    requiredExperience: "Not disclosed",
    requiredSkills: "Not disclosed",
    preferredSkills: "Not disclosed",
    datePosted: job.created ? new Date(job.created) : new Date(),
    applicationUrl: job.redirect_url || "",
    companyWebsite: "",
    vacancies: vacancies,
    candidatesNeeded: vacancies,
    vacancyStatus: vacancyStatus,
    vacancyEvidence: evidence,
    hiringUrgency: "Medium",
    hiringDemand: "Medium",
    aiSummary: "",
    rawData: JSON.stringify(job),
    descriptionHash: generateHash(job.description || job.title),
  };
}

function extractVacancies(description: string): { vacancies: number | null, evidence: string, vacancyStatus: string } {
  if (!description) return { vacancies: null, evidence: '', vacancyStatus: "Not publicly disclosed" };
  
  const regex = /\b(\d+)\s*(openings|positions available|vacancies|candidates)\b/i;
  const match = description.match(regex);
  
  if (match && match[1]) {
    const count = parseInt(match[1], 10);
    return { vacancies: count, evidence: match[0], vacancyStatus: "Publicly disclosed" };
  }

  const hiringRegex = /\bhiring\s*(\d+)\s*candidates\b/i;
  const hiringMatch = description.match(hiringRegex);
  
  if (hiringMatch && hiringMatch[1]) {
    const count = parseInt(hiringMatch[1], 10);
    return { vacancies: count, evidence: hiringMatch[0], vacancyStatus: "Publicly disclosed" };
  }

  const multipleRegex = /\b(multiple|several|various)\s*(openings|positions available|vacancies|candidates)\b/i;
  if (description.match(multipleRegex)) {
    return { vacancies: null, evidence: '', vacancyStatus: "Publicly disclosed, exact count unavailable" };
  }

  return { vacancies: null, evidence: '', vacancyStatus: "Not publicly disclosed" };
}

function determineWorkMode(description: string = "", title: string = ""): string {
  const text = (description + " " + title).toLowerCase();
  if (text.includes("remote") || text.includes("work from home")) return "Remote";
  if (text.includes("hybrid")) return "Hybrid";
  if (text.includes("on-site") || text.includes("onsite") || text.includes("in office")) return "On-site";
  return "Not disclosed";
}

function determineJobType(contractTime: string = "", contractType: string = ""): string {
  const time = contractTime.toLowerCase();
  const type = contractType.toLowerCase();
  
  if (time === "full_time" || type === "permanent") return "Full-time";
  if (time === "part_time") return "Part-time";
  if (time === "contract" || type === "contract") return "Contract";
  if (type === "internship") return "Internship";
  
  return "Not disclosed";
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
