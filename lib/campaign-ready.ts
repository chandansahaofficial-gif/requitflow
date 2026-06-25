import { prisma } from './prisma';

export interface ReadinessItem {
  key: string;
  label: string;
  passed: boolean;
  actionHint: string;
}

export interface ReadinessResult {
  ready: boolean;
  items: ReadinessItem[];
  missingRequirements: string[]; // backward compat
}

export async function checkCampaignReadyToStart(
  campaignId: string,
  userId: string
): Promise<ReadinessResult> {
  const missingRequirements: string[] = [];
  const items: ReadinessItem[] = [];

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
    return {
      ready: false,
      items: [],
      missingRequirements: ['Campaign not found or does not belong to user']
    };
  }

  const userSettings = await prisma.userSettings.findUnique({ where: { userId } });

  // 1. Sender email / SendGrid check
  const hasSendGridKey = !!process.env.SENDGRID_API_KEY;
  const hasSendGridEmail = !!process.env.SENDGRID_FROM_EMAIL;
  
  const smtpAccount = await prisma.smtpAccount.findUnique({ where: { userId } });
  const hasVerifiedSmtp = smtpAccount && smtpAccount.isVerified && smtpAccount.status === 'Active';

  const senderOk = hasVerifiedSmtp || (hasSendGridKey && hasSendGridEmail);
  
  items.push({
    key: 'senderEmail',
    label: 'Sender email connected',
    passed: senderOk,
    actionHint: 'Connect SMTP or SendGrid before starting this campaign.'
  });
  
  if (!senderOk) {
    missingRequirements.push('Connect SMTP or SendGrid before starting.');
  }

  // 2. Booking link check
  const bookingLink = campaign.bookingLink || campaign.ctaLink || userSettings?.bookingLink;
  const bookingOk = !!(bookingLink && bookingLink.startsWith('http'));
  items.push({
    key: 'bookingLink',
    label: 'Booking link added',
    passed: bookingOk,
    actionHint: 'Add a booking link to the campaign before starting.'
  });
  if (!bookingOk) {
    missingRequirements.push('Add a booking link to the campaign or your global settings');
  }

  // 3. Unsubscribe line check
  const hasUnsubscribeLine = !!(campaign.unsubscribeLine && campaign.unsubscribeLine.trim().length > 0);
  const hasUnsubscribeInSignature = !!(
    campaign.emailSignature &&
    campaign.emailSignature.toLowerCase().includes('unsubscribe')
  );
  const unsubscribeOk = hasUnsubscribeLine || hasUnsubscribeInSignature;
  items.push({
    key: 'unsubscribeLine',
    label: 'Unsubscribe line added',
    passed: unsubscribeOk,
    actionHint: 'Add an unsubscribe line to the campaign before starting.'
  });
  if (!unsubscribeOk) {
    missingRequirements.push('Add an unsubscribe line to the campaign email signature');
  }

  // 4. Leads check
  const leadsOk = campaign.campaignLeads.length > 0;
  items.push({
    key: 'leads',
    label: 'Leads selected',
    passed: leadsOk,
    actionHint: 'Add at least one lead to this campaign.'
  });
  if (!leadsOk) {
    missingRequirements.push('Add at least one lead to the campaign');
  }

  // 5. Email 1 generated for all leads
  let email1GeneratedOk = true;
  let email1ApprovedOk = true;

  if (campaign.campaignLeads.length > 0) {
    const step1Emails = campaign.emailSequences;
    const leadIds = campaign.campaignLeads.map(cl => cl.leadId);
    const emailLeadIds = step1Emails.map(e => e.leadId);

    if (step1Emails.length === 0) {
      email1GeneratedOk = false;
      missingRequirements.push('Generate Email Step 1 for the campaign leads');
    } else {
      const missingDrafts = leadIds.filter(id => !emailLeadIds.includes(id));
      if (missingDrafts.length > 0) {
        email1GeneratedOk = false;
        missingRequirements.push('Generate Email Step 1 drafts for all campaign leads');
      }
    }

    if (email1GeneratedOk) {
      const rejectedCount = step1Emails.filter(e => e.approvalStatus === 'Rejected').length;
      if (rejectedCount > 0) {
        email1ApprovedOk = false;
        missingRequirements.push('No Step 1 email draft can be Rejected');
      } else {
        const unapprovedCount = step1Emails.filter(e => e.approvalStatus !== 'Approved').length;
        if (unapprovedCount > 0) {
          email1ApprovedOk = false;
          missingRequirements.push('Approve Email 1 for all selected leads');
        }
      }
    }
  }

  items.push({
    key: 'email1Generated',
    label: 'Email 1 generated for all leads',
    passed: email1GeneratedOk,
    actionHint: 'Generate AI email drafts for all campaign leads.'
  });

  items.push({
    key: 'email1Approved',
    label: 'Email 1 approved for all leads',
    passed: email1ApprovedOk,
    actionHint: 'Review and approve Email 1 for all leads before starting.'
  });

  // 6. Daily sending limit (from SmtpAccount or Campaign/Settings)
  const dailyLimitVal = smtpAccount?.dailyLimit || campaign.dailyLimit || userSettings?.dailyEmailLimit || 0;
  const delaySeconds = smtpAccount?.delayBetweenEmailsSeconds || 120;
  
  const dailyLimitOk = dailyLimitVal >= 1 && dailyLimitVal <= 10 && delaySeconds >= 60 && delaySeconds <= 900;
  
  items.push({
    key: 'dailyLimit',
    label: 'Sending limit configured',
    passed: dailyLimitOk,
    actionHint: 'Configure Sender'
  });
  if (!dailyLimitOk) {
    missingRequirements.push('Set sending limit and delay before starting.');
  }

  return {
    ready: missingRequirements.length === 0,
    items,
    missingRequirements
  };
}
