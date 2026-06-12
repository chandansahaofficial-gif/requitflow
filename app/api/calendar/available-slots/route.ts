import { NextResponse } from 'next/server';
import { checkAvailableSlots } from '@/lib/calendar';

export async function POST(req: Request) {
  try {
    const { 
      userId, 
      timezone, 
      durationMinutes = 30,
      bufferBefore = 15,
      bufferAfter = 15,
      minimumNotice = 24,
      maximumHorizon = 14
    } = await req.json();

    if (!userId || !timezone) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const slots = await checkAvailableSlots(
      userId,
      timezone,
      durationMinutes,
      bufferBefore,
      bufferAfter,
      minimumNotice,
      maximumHorizon
    );

    return NextResponse.json({ success: true, slots });

  } catch (error: any) {
    console.error('Available Slots Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
