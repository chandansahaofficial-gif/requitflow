import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: { status: 'Active' }
    });

    // We can run process-due-emails logic in the background, or tell the frontend to hit it.
    // For now, simply mark active. A chron job / background task should hit process-due-emails.
    // Or we hit the local API asynchronously.
    
    // Fire and forget
    fetch(`${req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/campaigns/${params.id}/process-due-emails`, {
      method: 'POST',
      headers: { cookie: req.headers.get('cookie') || '' }
    }).catch(console.error);

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
