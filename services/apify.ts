export async function startGoogleMapsScraper(
  apiToken: string,
  actorId: string = 'compass/google-maps-extractor',
  input: any
) {
  // Encode actor ID: "owner/name" → "owner~name" for Apify REST API
  const encodedActorId = actorId.replace('/', '~');
  const url = `https://api.apify.com/v2/acts/${encodedActorId}/runs`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Apify run failed with status: ${response.status} — ${errText.slice(0, 300)}`);
  }

  return response.json();
}

export async function getRunStatus(apiToken: string, runId: string) {
  const url = `https://api.apify.com/v2/actor-runs/${runId}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiToken}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to get run status: ${response.statusText}`);
  }

  return response.json();
}

export async function getDatasetItems(apiToken: string, datasetId: string, limit = 200) {
  const url = `https://api.apify.com/v2/datasets/${datasetId}/items?limit=${limit}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiToken}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to get dataset items: ${response.statusText}`);
  }

  return response.json();
}
