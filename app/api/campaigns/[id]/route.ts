import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const updateData: any = {};
    const editableFields = [
      'name', 'campaignType', 'targetAudience', 'industry', 'offer', 
      'goal', 'tone', 'language', 'ctaType', 'ctaLink', 'senderName', 
      'agencyName', 'emailSignature', 'status', 'sendingMode',
      'timingMode', 'timezoneMode', 'allowedSendingDays', 'sendingWindowStart',
      'sendingWindowEnd', 'weekendsEnabled', 'skipHolidays', 'autoApproveEmails',
      'autoSendApprovedEmails', 'bookingAutomationMode', 'meetingType',
      'meetingDuration', 'minimumBookingNotice', 'maximumBookingHorizon',
      'autoCreateCalendarEvent', 'autoSendBookingConfirmation',
      'knowledgeBaseMode', 'selectedKnowledgeBaseFileIds'
    ];

    for (const field of editableFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const campaign = await prisma.campaign.update({
      where: { 
        id: id,
        userId: user.id
      },
      data: updateData
    });

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error("Update campaign error:", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const campaign = await prisma.campaign.findUnique({
      where: { id: id, userId: user.id },
      include: {
        _count: {
          select: { emailSequences: { where: { status: 'Sent' } } }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign._count.emailSequences > 0) {
      // Soft delete / archive
      await prisma.campaign.update({
        where: { id: id },
        data: { status: 'Archived' }
      });
      return NextResponse.json({ success: true, archived: true });
    } else {
      // Hard delete
      await prisma.campaign.delete({
        where: { id: id }
      });
      return NextResponse.json({ success: true, deleted: true });
    }

  } catch (error: any) {
    console.error("Delete campaign error:", error);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
