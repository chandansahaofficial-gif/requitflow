import { prisma } from '@/lib/prisma';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { decryptSmtpPass } from '@/lib/smtp-encryption';

export interface SendCampaignEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  campaignId: string;
  leadId: string;
  emailSequenceId: string;
}

export async function sendCampaignEmail({
  to,
  subject,
  html,
  text,
  campaignId,
  leadId,
  emailSequenceId
}: SendCampaignEmailOptions) {
  
  // Fetch all entities to perform safety checks
  const emailSequence = await prisma.emailSequence.findUnique({
    where: { id: emailSequenceId },
    include: {
      campaign: true,
      lead: true,
      user: true
    }
  });

  if (!emailSequence) {
    return { success: false, error: "Email sequence not found." };
  }

  const user = emailSequence.user;
  const campaign = emailSequence.campaign;
  const lead = emailSequence.lead;

  // Verify User exists
  if (!user) {
    return { success: false, error: "User associated with this email does not exist." };
  }

  // Verify ownership
  if (campaign.userId !== user.id) {
    return { success: false, error: "Campaign does not belong to the user." };
  }
  if (lead.userId !== user.id) {
    return { success: false, error: "Lead does not belong to the user." };
  }
  if (emailSequence.userId !== user.id || emailSequence.campaignId !== campaign.id) {
    return { success: false, error: "Email sequence does not belong to the correct user or campaign." };
  }

  // Campaign checks
  const bookingLink = campaign.bookingLink || campaign.ctaLink;
  if (!bookingLink) {
    return { success: false, error: "Campaign must have a booking link configured before sending." };
  }
  
  const hasUnsubscribeLine = !!(campaign.unsubscribeLine && campaign.unsubscribeLine.trim().length > 0);
  const hasUnsubscribeInSignature = !!(
    campaign.emailSignature &&
    campaign.emailSignature.toLowerCase().includes('unsubscribe')
  );
  if (!hasUnsubscribeLine && !hasUnsubscribeInSignature) {
    return { success: false, error: "Campaign must have an unsubscribe line configured before sending." };
  }

  // Email Sequence checks
  if (emailSequence.approvalStatus !== 'Approved') {
    return { success: false, error: "Email sequence must be Approved before sending." };
  }
  if (emailSequence.status === 'Sent') {
    return { success: false, error: "Email has already been sent." };
  }
  if (emailSequence.approvalStatus === 'Rejected') {
    return { success: false, error: "Email sequence has been rejected." };
  }
  if (!subject || subject.trim() === '') {
    return { success: false, error: "Email subject cannot be empty." };
  }
  if (!html || html.trim() === '') {
    return { success: false, error: "Email body cannot be empty." };
  }

  // Lead checks
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!to || !emailRegex.test(to)) {
    return { success: false, error: "Lead email address is invalid." };
  }
  if (lead.status === 'Unsubscribed') {
    return { success: false, error: "Cannot send to an unsubscribed lead." };
  }
  
  // Unsubscribe list check
  const isUnsub = await prisma.unsubscribeList.findUnique({
    where: { userId_email: { userId: user.id, email: to } }
  });
  if (isUnsub) {
    return { success: false, error: "Lead has unsubscribed and is on the global unsubscribe list." };
  }

  // Check if User has their own verified SMTP
  const smtpAccount = await prisma.smtpAccount.findUnique({
    where: { userId: user.id }
  });

  const hasVerifiedSmtp = smtpAccount && smtpAccount.isVerified && smtpAccount.status === 'Active';

  // Fallback to global SendGrid
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL;
  const sendgridFromName = process.env.SENDGRID_FROM_NAME || "Funnelzen AI";
  const hasSendGrid = !!(sendgridApiKey && sendgridFromEmail);

  if (!hasVerifiedSmtp && !hasSendGrid) {
    return {
      success: false,
      error: "Connect SMTP or SendGrid before starting this campaign."
    };
  }

  // Priority 1: User's Verified SMTP
  if (hasVerifiedSmtp) {
    try {
      const password = decryptSmtpPass(smtpAccount.smtpPassEncrypted);

      const transporter = nodemailer.createTransport({
        host: smtpAccount.smtpHost,
        port: smtpAccount.smtpPort,
        secure: smtpAccount.secure,
        auth: {
          user: smtpAccount.smtpUserEncrypted, // Actually stores plaintext username since it was originally encrypted but the request says smtpUsername required. Wait, schema says smtpUserEncrypted! I need to decrypt it too. Let's fix that below!
          pass: password
        }
      });

      // Fix: the username might be encrypted if we encrypted it, but the requirements said "SMTP password must be encrypted", it didn't explicitly say username. However the schema says smtpUserEncrypted, so we should decrypt both. Let's just decrypt both to be safe.
      const username = decryptSmtpPass(smtpAccount.smtpUserEncrypted);

      transporter.options.auth = {
        user: username,
        pass: password
      };

      const mailOptions = {
        from: `"${smtpAccount.fromName}" <${smtpAccount.fromEmail}>`,
        to,
        subject,
        text: text || html.replace(/<[^>]+>/g, ''),
        html
      };

      const info = await transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error: any) {
      console.error("SMTP Send Error:", error.message);
      return { success: false, error: "SMTP sending failed. Please check your SMTP settings." };
    }
  }

  // Priority 2: Fallback to SendGrid
  if (hasSendGrid) {
    sgMail.setApiKey(sendgridApiKey);

    const msg = {
      to,
      from: {
        name: sendgridFromName,
        email: sendgridFromEmail
      },
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    };

    try {
      const response = await sgMail.send(msg);
      const messageId = response[0]?.headers['x-message-id'];
      return {
        success: true,
        messageId
      };
    } catch (error: any) {
      console.error("SendGrid Send Error:", error.response?.body || error.message);
      
      const statusCode = error.code || error.response?.statusCode;
      
      if (statusCode === 401 || statusCode === 403) {
        return { success: false, error: "Email sending failed. Please check your SendGrid API key." };
      } else if (statusCode === 429) {
        return { success: false, error: "Email sending is temporarily limited. Please try again later." };
      } else if (error.message?.includes('verified sender')) {
        return { success: false, error: "Email sending failed. Please verify your sender email in SendGrid." };
      }
      
      return { success: false, error: "Email could not be sent. Please try again." };
    }
  }

  return { success: false, error: "No valid sending method found." };
}
