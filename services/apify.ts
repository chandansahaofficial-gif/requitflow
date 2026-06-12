export async function startGoogleMapsScraper(
  apiToken: string,
  actorId: string = 'compass/google-maps-extractor',
  input: any
) {
  const url = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs?token=${apiToken}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    throw new Error(`Apify start run failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getRunStatus(apiToken: string, runId: string) {
  const url = `https://api.apify.com/v2/actor-runs/${runId}?token=${apiToken}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to get run status: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getDatasetItems(apiToken: string, datasetId: string) {
  const url = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to get dataset items: ${response.statusText}`);
  }
  
  return response.json();
}
