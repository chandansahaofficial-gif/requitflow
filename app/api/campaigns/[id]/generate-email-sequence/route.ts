import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: campaignId } = await params;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openrouterModel = process.env.OPENROUTER_MODEL || "google/gemini-1.5-pro";

  if (!openrouterKey) {
    return NextResponse.json({ error: 'OpenRouter API Key is missing in settings' }, { status: 400 });
  }

  try {
    const { leadIds } = await req.json();
    if (!leadIds || !Array.isArray(leadIds)) {
      return NextResponse.json({ error: 'leadIds array is required' }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        userId: user.id
      }
    });

    let successCount = 0;
    let failedCount = 0;
    const failedLeads: string[] = [];

    // Helper to generate for a single lead
    const generateForLead = async (lead: any) => {
      try {
        // Skip if already generated
        const existing = await prisma.emailSequence.findFirst({
          where: { campaignId, leadId: lead.id }
        });
        if (existing) return { success: false, reason: "Already exists" };

        const prompt = `You are an expert cold email strategist for recruitment agencies and staffing agencies.
Write a personalized email sequence for a recruitment agency contacting a hiring company.
Goal: Book a discovery call to discuss hiring needs, staffing support, candidate sourcing, or recruitment automation.
Use:
- Business name: ${lead.businessName}
- Location: ${lead.location || lead.address || 'Unknown'}
- Website: ${lead.website || 'Unknown'}
- Category: ${lead.category || 'Unknown'}
- Lead score: ${lead.leadScore}
- Lead tier: ${lead.leadTier}
- AI insight: ${lead.aiInsight || 'None'}
- Campaign goal: ${campaign.goal || 'Book Discovery Call'}

Rules:
- Keep emails short and human. Do not sound robotic.
- Do not overpromise. Do not claim they are hiring unless data proves it.
- Do not use spammy words. Use one clear CTA.
- Make each follow-up feel natural.
- Each lead must get a unique email sequence.
- Return ONLY valid JSON representing an array of exactly 5 email steps. No markdown code blocks, just raw JSON.
Format:
[
  { "step": 1, "name": "First Outreach", "delay_days": 0, "subject": "...", "preview_text": "...", "body": "...", "cta_text": "...", "cta_link": "..." },
  { "step": 2, "name": "Soft Follow-Up", "delay_days": 2, "subject": "...", "preview_text": "...", "body": "...", "cta_text": "...", "cta_link": "..." },
  { "step": 3, "name": "Value Email", "delay_days": 4, "subject": "...", "preview_text": "...", "body": "...", "cta_text": "...", "cta_link": "..." },
  { "step": 4, "name": "Proof / Case Study", "delay_days": 6, "subject": "...", "preview_text": "...", "body": "...", "cta_text": "...", "cta_link": "..." },
  { "step": 5, "name": "Final Check-In", "delay_days": 8, "subject": "...", "preview_text": "...", "body": "...", "cta_text": "...", "cta_link": "..." }
]`;

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openrouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://funnelzen.ai",
            "X-Title": "FunnelZen AI"
          },
          body: JSON.stringify({
            model: openrouterModel,
            messages: [{ role: "user", content: prompt }]
          })
        });

        const orData = await res.json();
        let jsonStr = orData.choices[0].message.content.trim();
        
        // Clean markdown backticks if returned
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```/g, '').trim();

        const sequenceData = JSON.parse(jsonStr);

        // Save to DB
        for (const seq of sequenceData) {
          await prisma.emailSequence.create({
            data: {
              userId: user.id,
              campaignId,
              leadId: lead.id,
              name: seq.name,
              subject: seq.subject,
              previewText: seq.preview_text,
              body: seq.body,
              sequenceStep: seq.step,
              ctaText: seq.cta_text,
              ctaLink: seq.cta_link,
              delayAmount: seq.delay_days ?? 0,
              delayUnit: 'business_days',
              status: "Draft",
              approvalStatus: "Pending",
              aiOriginalSubject: seq.subject,
              aiOriginalBody: seq.body,
              aiGenerationReason: "Generated via OpenRouter standard campaign prompt"
            }
          });
        }
        
        // Mark lead in campaign as email generated
        await prisma.campaignLead.update({
          where: { campaignId_leadId: { campaignId, leadId: lead.id } },
          data: { status: "Email Generated" }
        });

        return { success: true };
      } catch (err: any) {
        console.error("AI Generation failed for lead", lead.id, err);
        return { success: false, reason: err.message, leadId: lead.id };
      }
    };

    // Run concurrently in small batches
    const batchResults = await Promise.all(leads.map(generateForLead));
    
    batchResults.forEach(r => {
      if (r.success) successCount++;
      else if (r.leadId) {
        failedCount++;
        failedLeads.push(r.leadId);
      }
    });

    return NextResponse.json({ success: true, successCount, failedCount, failedLeads });

  } catch (error: any) {
    console.error("Generate sequence error:", error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
