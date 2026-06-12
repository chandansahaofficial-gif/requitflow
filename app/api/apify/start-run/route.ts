import { NextResponse } from 'next/server';
import { startGoogleMapsScraper, getRunStatus, getDatasetItems } from '@/services/apify';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apifyToken = process.env.APIFY_API_TOKEN;

  if (!apifyToken) {
    return NextResponse.json({ error: 'Apify token missing. Please add APIFY_API_TOKEN to .env' }, { status: 400 });
  }

  const { businessType, location, country, maxResults } = await req.json();

  const searchQueries = [`${businessType} in ${location}, ${country}`];

  try {
    const run = await startGoogleMapsScraper(apifyToken, process.env.APIFY_GOOGLE_MAPS_ACTOR_ID || 'compass/google-maps-extractor', {
      searchStringsArray: searchQueries,
      maxCrawledPlacesPerSearch: maxResults,
      language: "en",
    });

    return NextResponse.json({ runId: run.data.id, status: run.data.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
