const nodemailer = require('nodemailer');
const prisma = require('../lib/prisma');
const { sendN8nWebhook } = require('./n8nService');

async function sendPendingEmails() {
  try {
    // Find all emails that are ready to send
    const pendingLeads = await prisma.campaignLead.findMany({
      where: { status: 'generated' },
      include: {
        lead: true,
        campaign: { include: { user: true } }
      },
      take: 10 // process in batches
    });

    for (const cl of pendingLeads) {
      const user = cl.campaign.user;
      const lead = cl.lead;

      if (user.plan === 'Free') {
        console.log(`User ${user.email} is on Free plan. Skipping sending.`);
        await prisma.campaignLead.update({
          where: { id: cl.id },
          data: { status: 'failed' }
        });
        continue;
      }

      if (!user.smtpHost || !user.smtpUser || !user.smtpPass) {
        console.log(`User ${user.email} missing SMTP config. Skipping lead ${lead.email}`);
        await prisma.campaignLead.update({
          where: { id: cl.id },
          data: { status: 'failed' } // marked failed due to missing config
        });
        continue;
      }

      if (!lead.email) {
        await prisma.campaignLead.update({
          where: { id: cl.id },
          data: { status: 'failed' } // no email address to send to
        });
        continue;
      }

      try {
        const transporter = nodemailer.createTransport({
          host: user.smtpHost,
          port: 587,
          secure: false, // TLS
          auth: {
            user: user.smtpUser,
            pass: user.smtpPass
          }
        });

        await transporter.sendMail({
          from: user.email, // using login email as sender
          to: lead.email,
          subject: cl.generatedSubject || 'Following up',
          text: cl.generatedBody || ''
        });

        // Mark as sent
        await prisma.campaignLead.update({
          where: { id: cl.id },
          data: { status: 'sent' }
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { emailsSentThisMonth: { increment: 1 } }
        });

        console.log(`Successfully sent email to ${lead.email}`);
        
        await sendN8nWebhook(user, 'email_sent', {
          campaign_id: cl.campaign.id,
          lead_id: lead.id,
          email: lead.email,
          subject: cl.generatedSubject
        });
        
        // Wait 2 seconds between emails to avoid spam filters
        await new Promise(res => setTimeout(res, 2000));
        
      } catch (err) {
        console.error(`Failed to send email to ${lead.email}:`, err);
        await prisma.campaignLead.update({
          where: { id: cl.id },
          data: { status: 'failed' }
        });
        await sendN8nWebhook(user, 'email_failed', {
          campaign_id: cl.campaign.id,
          lead_id: lead.id,
          email: lead.email,
          error: err.message
        });
      }
    }
  } catch (err) {
    console.error('Email worker error:', err);
  }
}

// Start polling
function startEmailWorker() {
  console.log('Started email background worker');
  setInterval(sendPendingEmails, 15000); // Check every 15 seconds
}

module.exports = { startEmailWorker };
