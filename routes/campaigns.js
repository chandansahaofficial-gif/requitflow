const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const { generatePersonalizedEmail } = require('../services/aiService');
const { sendN8nWebhook } = require('../services/n8nService');

const router = express.Router();

// Get user's campaigns
router.get('/', authMiddleware, async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: req.user.userId },
      include: {
        targetAudience: true,
        _count: { select: { leads: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(campaigns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Create campaign
router.post('/', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { _count: { select: { campaigns: true } } }
    });

    if (user.plan === 'Free') {
      return res.status(403).json({ error: 'Free plan does not support campaigns.' });
    }
    
    if (user.plan === 'Starter' && user._count.campaigns >= 1) {
      return res.status(403).json({ error: 'Starter plan allows only 1 campaign. Upgrade to create more.' });
    }

    const { name, targetAudienceId, goal } = req.body;
    const campaign = await prisma.campaign.create({
      data: {
        userId: req.user.userId,
        name,
        targetAudienceId: targetAudienceId || null,
        goal,
        status: 'active'
      }
    });
    res.json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Add leads to campaign and trigger AI generation
router.post('/:campaignId/leads', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { leadIds } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds array is required' });
    }

    // Verify campaign belongs to user
    const campaign = await prisma.campaign.findUnique({ 
      where: { id: campaignId },
      include: { user: true }
    });
    if (!campaign || campaign.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    const user = campaign.user;

    const addedLeads = [];
    for (const leadId of leadIds) {
      // Check if lead belongs to user
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead || lead.userId !== req.user.userId) continue;

      const campaignLead = await prisma.campaignLead.create({
        data: {
          campaignId,
          leadId,
          status: 'pending'
        }
      });
      addedLeads.push(campaignLead);

      await sendN8nWebhook(user, 'lead_added_to_campaign', {
        campaign_id: campaignId,
        lead_id: leadId,
        lead: lead
      });

      // Fire off AI generation asynchronously (MVP background job)
      generatePersonalizedEmail(campaignLead.id).catch(e => console.error('Background AI gen failed:', e));
    }

    res.json({ message: `Added ${addedLeads.length} leads to campaign`, addedLeads });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add leads to campaign' });
  }
});

// Edit a generated email
router.put('/:campaignId/leads/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { generatedSubject, generatedBody } = req.body;
    
    // basic verification
    const campaignLead = await prisma.campaignLead.findUnique({ where: { id }, include: { campaign: true } });
    if (!campaignLead || campaignLead.campaign.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    const updated = await prisma.campaignLead.update({
      where: { id },
      data: { generatedSubject, generatedBody }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// Manually send the email
router.post('/:campaignId/leads/:id/send', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const campaignLead = await prisma.campaignLead.findUnique({
      where: { id },
      include: { lead: true, campaign: { include: { user: true } } }
    });

    if (!campaignLead || campaignLead.campaign.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    const user = campaignLead.campaign.user;
    const lead = campaignLead.lead;

    if (!user.smtpHost || !user.smtpUser || !user.smtpPass) {
      return res.status(400).json({ error: 'SMTP settings missing' });
    }

    if (!lead.email) {
      return res.status(400).json({ error: 'Lead has no email address' });
    }

    const nodemailer = require('nodemailer');
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
      from: user.email,
      to: lead.email,
      subject: campaignLead.generatedSubject || 'Following up',
      text: campaignLead.generatedBody || ''
    });

    await prisma.campaignLead.update({
      where: { id },
      data: { status: 'sent' }
    });

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Send error:', error);
    await prisma.campaignLead.update({ where: { id: req.params.id }, data: { status: 'failed' } });
    res.status(500).json({ error: 'Failed to send email: ' + error.message });
  }
});

module.exports = router;
