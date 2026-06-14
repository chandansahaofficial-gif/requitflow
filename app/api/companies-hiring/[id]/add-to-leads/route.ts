import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in again.' }, { status: 401 });
    }

    const companyId = params.id;
    if (companyId.startsWith('unlinked-')) {
        return NextResponse.json({ error: 'Cannot add synthetic group to leads.' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if lead already exists
    const existingLead = await prisma.lead.findFirst({
      where: {
        userId: user.id,
        companyId: companyId
      }
    });

    if (existingLead) {
      // We could update it, but for now we just return "Already Exists"
      return NextResponse.json({ status: 'Already Exists', lead: existingLead });
    }

    // Create new lead linked to this company
    const newLead = await prisma.lead.create({
      data: {
        userId: user.id,
        companyId: company.id,
        businessName: company.name,
        website: company.website,
        phone: null,
        email: null,
        address: company.location,
        country: company.country,
        category: 'Unknown',
        source: 'Companies Hiring',
        status: 'New'
      }
    });

    return NextResponse.json({ status: 'Added', lead: newLead });

  } catch (error: any) {
    console.error('Add to Leads error:', error);
    return NextResponse.json({ error: 'Failed to add to leads' }, { status: 500 });
  }
}
