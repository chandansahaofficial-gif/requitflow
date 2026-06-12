const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Update user settings (SMTP, OpenRouter, Calendar)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { smtpHost, smtpUser, smtpPass, openRouterKey, apifyToken, apifyActorId, n8nWebhookUrl, n8nWebhookSecret, n8nEnabled } = req.body;
    
    // In a production app, smtpPass and API keys should be encrypted.
    // For this MVP, we save them directly.
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        smtpHost: smtpHost !== undefined ? smtpHost : undefined,
        smtpUser: smtpUser !== undefined ? smtpUser : undefined,
        smtpPass: smtpPass !== undefined ? smtpPass : undefined,
        openRouterKey: openRouterKey !== undefined ? openRouterKey : undefined,
        apifyToken: apifyToken !== undefined ? apifyToken : undefined,
        apifyActorId: apifyActorId !== undefined ? apifyActorId : undefined,
        n8nWebhookUrl: n8nWebhookUrl !== undefined ? n8nWebhookUrl : undefined,
        n8nWebhookSecret: n8nWebhookSecret !== undefined ? n8nWebhookSecret : undefined,
        n8nEnabled: n8nEnabled !== undefined ? n8nEnabled : undefined,
      }
    });

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Test SMTP Connection
router.post('/test-smtp', authMiddleware, async (req, res) => {
  try {
    const { smtpHost, smtpUser, smtpPass } = req.body;
    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(400).json({ error: 'Missing SMTP credentials' });
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: 587,
      secure: false, // TLS
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    await transporter.verify();
    res.json({ message: 'Connection successful!' });
  } catch (error) {
    console.error('SMTP Test Error:', error);
    res.status(500).json({ error: 'Connection failed: ' + error.message });
  }
});

// Test n8n Connection
router.post('/test-n8n', authMiddleware, async (req, res) => {
  try {
    const { n8nWebhookUrl, n8nWebhookSecret } = req.body;
    if (!n8nWebhookUrl) return res.status(400).json({ error: 'Missing n8n webhook URL' });

    const headers = { 'Content-Type': 'application/json' };
    if (n8nWebhookSecret) headers['x-webhook-secret'] = n8nWebhookSecret;

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ event_type: 'test_connection', message: 'Hello from LeadRadar' })
    });

    if (!response.ok) throw new Error(`Webhook responded with status ${response.status}`);
    res.json({ message: 'n8n connection successful!' });
  } catch (error) {
    console.error('n8n Test Error:', error);
    res.status(500).json({ error: 'Connection failed: ' + error.message });
  }
});

// Test Apify Connection
router.post('/test-apify', authMiddleware, async (req, res) => {
  try {
    const { apifyToken } = req.body;
    if (!apifyToken) return res.status(400).json({ error: 'Missing Apify token' });

    const response = await fetch('https://api.apify.com/v2/users/me', {
      headers: { 'Authorization': `Bearer ${apifyToken}` }
    });

    if (!response.ok) throw new Error(`Apify responded with status ${response.status}`);
    res.json({ message: 'Apify connection successful!' });
  } catch (error) {
    console.error('Apify Test Error:', error);
    res.status(500).json({ error: 'Connection failed: ' + error.message });
  }
});

module.exports = router;
