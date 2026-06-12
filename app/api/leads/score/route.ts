import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { leadId } = await req.json();

  const lead = await prisma.lead.findUnique({ where: { id: leadId, userId: user.id } });
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  let score = 0;
  
  if (lead.businessName) score += 10;
  if (lead.phone) score += 20;
  if (lead.website) score += 20;
  if (lead.address) score += 10;
  if (lead.rating && lead.rating >= 4.0) score += 15;
  if (lead.googleMapsLink) score += 10;
  if (lead.email) score += 15;

  let tier = "Cold";
  if (score >= 75) tier = "Hot";
  else if (score >= 45) tier = "Warm";

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: { leadScore: score, leadTier: tier }
  });

  return NextResponse.json({ lead: updatedLead });
}
