const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const { sendN8nWebhook } = require('../services/n8nService');

const router = express.Router();

// Get all leads for the user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Run Apify Lead Generation
router.post('/apify', authMiddleware, async (req, res) => {
  try {
    const { businessType, location, maxResults, countryCode, source } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    const token = user.apifyToken || process.env.APIFY_API_TOKEN;
    if (!token) return res.status(400).json({ error: 'Apify API token not configured.' });

    // Plan check
    let maxApifyLeads = 25; // Free
    if (user.plan === 'Starter') maxApifyLeads = 500;
    if (user.plan === 'Pro') maxApifyLeads = 3000;
    if (user.plan === 'Agency') maxApifyLeads = 10000;

    if (user.apifyLeadsThisMonth >= maxApifyLeads) {
      return res.status(403).json({ error: 'Apify lead generation limit reached for your plan.' });
    }

    let actorId = user.apifyActorId || process.env.APIFY_ACTOR_ID || 'apify~google-search-scraper';
    let payload = {};

    if (source === 'google') {
      actorId = 'compass~crawler-google-places';
      payload = {
        searchStringsArray: [`${businessType} in ${location}`],
        maxCrawledPlacesPerSearch: maxResults,
        language: 'en',
        countryCode,
        includeWebResults: false,
        deeperCityScrape: false,
        maxImages: 0,
        scrapeReviews: false,
      };
    } else {
      let queries = '';
      if (source === 'linkedin') queries = `site:linkedin.com/in/ ${businessType} ${location}`;
      else if (source === 'jobs') queries = `site:linkedin.com/jobs/view/ ${businessType} ${location}`;
      else if (source === 'employees') queries = `site:linkedin.com/in/ "open to work" OR "looking for opportunities" ${businessType} ${location}`;
      
      payload = {
        queries,
        resultsPerPage: maxResults,
        maxPagesPerQuery: 1,
        languageCode: 'en',
        countryCode: countryCode,
      };
    }

    // Trigger run
    const startRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (!startRes.ok) throw new Error('Failed to start Apify actor');

    const runData = await startRes.json();
    const runId = runData.data.id;
    const datasetId = runData.data.defaultDatasetId;

    // Poll for completion
    let status = 'RUNNING';
    let polls = 0;
    while (['RUNNING','READY','CREATED'].includes(status)) {
      await new Promise(r => setTimeout(r, 3000));
      if (++polls > 60) throw new Error('Scraping timed out.');
      const r = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!r.ok) throw new Error('Poll failed');
      const { data } = await r.json();
      status = data.status;
      if (['FAILED','ABORTED','TIMED-OUT'].includes(status)) throw new Error(`Run ${status}`);
    }

    // Fetch dataset
    const dsRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&limit=${maxResults}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!dsRes.ok) throw new Error('Failed to fetch dataset items');
    
    const currentItems = await dsRes.json();
    let leadsToSave = [];
    
    // Normalize based on source
    if (source === 'google') {
       leadsToSave = currentItems.map(item => ({
         name: item.title || 'Unknown Business',
         email: item.email || null,
         phone: item.phone || null,
         company: item.title,
         website: item.website || null,
         linkedin: null,
         source: 'Apify - Google Maps'
       }));
    } else {
       const orgResults = currentItems[0]?.organicResults || [];
       leadsToSave = orgResults.map(item => ({
         name: item.title ? item.title.split('-')[0].trim() : 'Unknown',
         email: null,
         phone: null,
         company: item.title ? item.title.split('-')[1]?.trim() : null,
         website: item.url,
         linkedin: item.url,
         source: 'Apify - LinkedIn'
       }));
    }

    let savedCount = 0;
    let savedLeads = [];
    for (const l of leadsToSave) {
      if (user.apifyLeadsThisMonth + savedCount >= maxApifyLeads) break;
      const created = await prisma.lead.create({
        data: {
          userId: user.id,
          name: l.name,
          email: l.email,
          phone: l.phone,
          company: l.company,
          linkedin: l.linkedin,
          source: l.source
        }
      });
      savedLeads.push(created);
      savedCount++;
    }

    if (savedCount > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { apifyLeadsThisMonth: { increment: savedCount } }
      });

      await sendN8nWebhook(user, 'new_leads_imported', {
        count: savedCount,
        source: source
      });
    }

    res.json({ message: `Successfully generated ${savedCount} leads`, leads: savedLeads });
  } catch (error) {
    console.error('Apify generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
