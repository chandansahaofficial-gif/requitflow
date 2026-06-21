import { prisma } from './prisma';

export async function checkCampaignReadyToStart(campaignId: string, userId: string) {
  const missingRequirements: string[] = [];

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      campaignLeads: true,
      emailSequences: {
        where: { sequenceStep: 1 }
      }
    }
  });

  if (!campaign || campaign.userId !== userId) {
    return { ready: false, missingRequirements: ["Campaign not found or does not belong to user"] };
  }

  if (["Active", "Completed", "Archived", "Deleted"].includes(campaign.status)) {
    missingRequirements.push("Campaign is already Active, Completed, or Archived");
  }

  if (campaign.campaignLeads.length === 0) {
    missingRequirements.push("Add at least one lead to the campaign");
  }

  const userSettings = await prisma.userSettings.findUnique({ where: { userId } });
  
  if (!userSettings?.smtpHost || !userSettings?.smtpUserEncrypted) {
    missingRequirements.push("Configure Sender Email / SMTP in Settings");
  }

  const bookingLink = campaign.bookingLink || userSettings?.bookingLink;
  if (!bookingLink) {
    missingRequirements.push("Add a booking link to the campaign or your global settings");
  }

  const hasUnsubscribe = (campaign.emailSignature && campaign.emailSignature.toLowerCase().includes("unsubscribe")) || false;
  if (!hasUnsubscribe) {
    missingRequirements.push("Add an unsubscribe line to the campaign email signature");
  }

  const dailyLimit = campaign.dailyLimit || userSettings?.dailyEmailLimit || 100;
  if (!dailyLimit || dailyLimit <= 0) {
    missingRequirements.push("Set a valid daily sending limit");
  }

  // Step 1 email checks
  if (campaign.campaignLeads.length > 0) {
    const step1Emails = campaign.emailSequences;
    
    if (step1Emails.length === 0) {
      missingRequirements.push("Generate Email Step 1 for the campaign leads");
    } else {
      const leadIds = campaign.campaignLeads.map(cl => cl.leadId);
      const emailLeadIds = step1Emails.map(e => e.leadId);
      
      const missingDrafts = leadIds.filter(id => !emailLeadIds.includes(id));
      if (missingDrafts.length > 0) {
        missingRequirements.push("Generate Email Step 1 drafts for all campaign leads");
      }

      const rejectedCount = step1Emails.filter(e => e.approvalStatus === "Rejected").length;
      if (rejectedCount > 0) {
        missingRequirements.push("No Step 1 email draft can be Rejected");
      }

      const unapprovedCount = step1Emails.filter(e => e.approvalStatus !== "Approved").length;
      if (unapprovedCount > 0) {
        missingRequirements.push("Approve Email 1 for all selected leads");
      }
    }
  }

  return {
    ready: missingRequirements.length === 0,
    missingRequirements
  };
}
