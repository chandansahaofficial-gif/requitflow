import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const totalLeads = await prisma.lead.count({ where: { userId: user.id } });
  const hotLeads = await prisma.lead.count({ where: { userId: user.id, leadTier: "Hot" } });
  const totalCampaigns = await prisma.campaign.count({ where: { userId: user.id } });
  const totalEmails = await prisma.emailSequence.count({ where: { userId: user.id, status: "Sent" } });
  const totalReplies = await prisma.reply.count({ where: { userId: user.id } });
  const totalBooked = await prisma.bookedCall.count({ where: { userId: user.id } });

  // Conversion rate (booked calls / total emails sent * 100)
  const conversionRate = totalEmails > 0 ? ((totalBooked / totalEmails) * 100).toFixed(1) + "%" : "0.0%";

  return NextResponse.json({ 
    totalLeads, 
    hotLeads, 
    totalCampaigns, 
    conversionRate,
    funnel: {
      added: totalLeads,
      emailsSent: totalEmails,
      replies: totalReplies,
      booked: totalBooked
    }
  });
}
