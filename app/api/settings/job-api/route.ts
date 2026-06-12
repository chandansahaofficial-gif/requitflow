import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAdzuna = !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

    return NextResponse.json({
      settings: {
        adzunaConfigured: hasAdzuna,
        openRouterConfigured: hasOpenRouter,
        defaultCountry: process.env.ADZUNA_DEFAULT_COUNTRY || 'gb',
        cacheDuration: process.env.ADZUNA_CACHE_MINUTES || '15',
        dailyLimit: process.env.JOB_SEARCH_DAILY_LIMIT || '100',
        aiBatchSize: process.env.AI_JOB_ANALYSIS_BATCH_SIZE || '10',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
