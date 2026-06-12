import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const presets = await prisma.companyFilterPreset.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(presets);
  } catch (error) {
    console.error('Filter presets GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description, filters, isDefault } = await req.json();

    if (!name || !filters) {
      return NextResponse.json({ error: 'Name and filters are required' }, { status: 400 });
    }

    if (isDefault) {
      // Unset previous default
      await prisma.companyFilterPreset.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    const preset = await prisma.companyFilterPreset.create({
      data: {
        userId: user.id,
        name,
        description,
        filters: typeof filters === 'string' ? filters : JSON.stringify(filters),
        isDefault: isDefault || false
      }
    });

    return NextResponse.json(preset);
  } catch (error) {
    console.error('Filter presets POST error:', error);
    return NextResponse.json({ error: 'Failed to create preset' }, { status: 500 });
  }
}
