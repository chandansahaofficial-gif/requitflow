/**
 * Apify REST API client for Companies Hiring sync.
 * Actor IDs like "owner/actor-name" must be URL-encoded as "owner~actor-name"
 * for the Apify REST API v2 /acts/ endpoint.
 */

/**
 * Build actor input based on source and search params.
 * Each actor may expect different field names.
 */
function buildLinkedInSearchUrl(keyword: string, location: string): string {
  // Builds a LinkedIn Jobs search URL from keyword + location
  // curious_coder/linkedin-jobs-scraper requires an array of LinkedIn search page URLs
  const base = 'https://www.linkedin.com/jobs/search/';
  const params = new URLSearchParams();
  if (keyword) params.set('keywords', keyword);
  if (location) params.set('location', location);
  params.set('f_TPR', 'r604800'); // posted in last 7 days
  return `${base}?${params.toString()}`;
}

function buildActorInput(source: string, keyword: string, location: string, country: string, maxResults: number): Record<string, any> {
  switch (source) {
    case 'linkedin':
      // curious_coder/linkedin-jobs-scraper — REQUIRES "urls" (array of LinkedIn search URLs)
      return {
        urls: [buildLinkedInSearchUrl(keyword, location)],
        count: maxResults,
        scrapeCompany: false,
      };

    case 'indeed':
      // orgupdate/indeed-jobs-scraper — REQUIRES "includeKeyword"
      return {
        includeKeyword: keyword,
        locationName: location || undefined,
        countryName: country || undefined,
        pagesToFetch: Math.ceil(maxResults / 15), // ~15 results per page
      };

    case 'google_jobs':
      // orgupdate/google-jobs-scraper — uses "includeKeyword" + "locationName"
      return {
        includeKeyword: keyword,
        locationName: location || undefined,
        maxResults: maxResults,
        language: 'en',
      };

    case 'remote_jobs':
      // orgupdate/remote-co-jobs-scraper
      return {
        includeKeyword: keyword,
        maxItems: maxResults,
      };

    case 'world_jobs':
      // automation-lab/multi-ats-jobs-scraper — REQUIRES "companies" array of domain objects
      // Since we don't have a static list, we pass keyword as a filter instead
      return {
        companies: [],           // empty triggers broad search mode if supported
        filters: {
          keywords: keyword,
          location: location || undefined,
        },
        maxJobs: maxResults,
      };

    default:
      return { keyword, location, country, maxResults };
  }
}

export async function runApifyActor(source: string, keyword: string, location: string, country: string, maxResults: number): Promise<any[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error('Apify is not connected. Add APIFY_API_TOKEN in environment variables.');
  }

  let actorId = '';
  switch (source) {
    case 'linkedin':
      actorId = process.env.APIFY_LINKEDIN_JOBS_ACTOR || '';
      break;
    case 'indeed':
      actorId = process.env.APIFY_INDEED_JOBS_ACTOR || '';
      break;
    case 'google_jobs':
      actorId = process.env.APIFY_GOOGLE_JOBS_ACTOR || '';
      break;
    case 'remote_jobs':
      actorId = process.env.APIFY_REMOTE_JOBS_ACTOR || '';
      break;
    case 'world_jobs':
      actorId = process.env.APIFY_WORLD_JOBS_ACTOR || '';
      break;
    default:
      throw new Error('Invalid Apify source selected.');
  }

  if (!actorId) {
    throw new Error('Apify actor is not configured for this source.');
  }

  // Apify REST API requires "owner/actor-name" → "owner~actor-name" in the URL
  const encodedActorId = actorId.replace('/', '~');

  const input = buildActorInput(source, keyword, location, country, maxResults);

  // Start the actor run
  const runResponse = await fetch(`https://api.apify.com/v2/acts/${encodedActorId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  if (!runResponse.ok) {
    const errText = await runResponse.text().catch(() => '');
    throw new Error(`Apify run failed with status: ${runResponse.status}${errText ? ` — ${errText.slice(0, 200)}` : ''}`);
  }

  const runData = await runResponse.json();
  const runId: string = runData?.data?.id;

  if (!runId) {
    throw new Error('Apify did not return a run ID. Check actor input format.');
  }

  // Poll for completion — max 5 minutes (60 × 5s)
  const maxAttempts = 60;
  let attempts = 0;
  let datasetId = '';

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;

    const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!statusResponse.ok) continue;

    const statusData = await statusResponse.json();
    const status: string = statusData?.data?.status;

    if (status === 'SUCCEEDED') {
      datasetId = statusData.data.defaultDatasetId;
      break;
    } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify job sync failed with status: ${status}. Please check actor input configuration.`);
    }
    // RUNNING or READY — keep polling
  }

  if (!datasetId) {
    throw new Error('Apify job sync timed out after 5 minutes. Try reducing maxResults.');
  }

  // Fetch dataset items
  const datasetResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?limit=${maxResults}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!datasetResponse.ok) {
    throw new Error(`Failed to fetch Apify dataset: ${datasetResponse.status}`);
  }

  const items = await datasetResponse.json();
  return Array.isArray(items) ? items : [];
}
