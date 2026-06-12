import { searchJoobleJobs, normalizeJoobleJob, removeDuplicateJobs, groupJobsByCompany } from './lib/jooble';
import 'dotenv/config';

async function run() {
  try {
    console.log("Starting Jooble API test...");
    
    // Test 1: Real search
    const filters = {
      category: 'IT Companies',
      jobTitle: 'Software Developer',
      country: 'in', // Maps to Jooble implicitly? The key handles location.
      location: 'Bangalore',
      resultsPerPage: 25,
      page: 1
    };

    const data = await searchJoobleJobs(filters);
    console.log(`Found ${data.totalCount || data.jobs?.length} raw jobs`);

    if (!data.jobs || data.jobs.length === 0) {
      console.log("No jobs returned. Try adjusting filters.");
      return;
    }

    const rawJobs = data.jobs;
    const normalized = rawJobs.map(normalizeJoobleJob);
    console.log(`Normalized ${normalized.length} jobs.`);

    const deduplicated = removeDuplicateJobs(normalized);
    console.log(`After deduplication: ${deduplicated.length} unique jobs.`);

    console.log("\nSample Normalized Job:");
    console.log(JSON.stringify(deduplicated[0], null, 2));

    const grouped = groupJobsByCompany(deduplicated);
    console.log(`\nGrouped into ${Object.keys(grouped).length} unique companies.`);

    // Check vacancy safety rules
    const fakeJobsWithVacancies = [
      { snippet: "We have 5 openings for this role.", title: "Dev", location: "Remote" },
      { snippet: "Hiring 10 candidates immediately.", title: "Dev", location: "Remote" },
      { snippet: "3 positions available for software engineers", title: "Dev", location: "Remote" },
      { snippet: "4 vacancies open", title: "Dev", location: "Remote" },
      { snippet: "Looking for a software developer to join our growing team.", title: "Dev", location: "Remote" },
    ];

    console.log("\nTesting Vacancy Safety Rules:");
    fakeJobsWithVacancies.forEach(job => {
       const norm = normalizeJoobleJob(job);
       console.log(`Snippet: "${job.snippet}"`);
       console.log(` -> Vacancies: ${norm.vacancies}, Status: ${norm.vacancyStatus}, Evidence: ${norm.vacancyEvidence}\n`);
    });

  } catch (error) {
    console.error("Test failed:", error);
  }
}

run();
