import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// File touched to clear IDE cache
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: campaignId } = await params;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openrouterModel = process.env.OPENROUTER_MODEL || 'google/gemini-1.5-pro';

  if (!openrouterKey) {
    return NextResponse.json({
      error: 'AI service is not configured. Please add your OpenRouter API key in Settings.'
    }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { leadIds: providedLeadIds } = body;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    }

    // If no leadIds provided, auto-fetch all campaign leads
    let leadIds: string[] = providedLeadIds || [];
    if (!leadIds.length) {
      const campaignLeads = await prisma.campaignLead.findMany({
        where: { campaignId },
        select: { leadId: true }
      });
      leadIds = campaignLeads.map(cl => cl.leadId);
    }

    if (!leadIds.length) {
      return NextResponse.json({
        error: 'No leads found for this campaign. Add leads before generating emails.'
      }, { status: 400 });
    }

    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds }, userId: user.id }
    });

    // Build AI prompt context from campaign fields
    const campaignContext = `
Campaign Goal: ${campaign.goal || 'Book a discovery call'}
Target Audience: ${campaign.targetAudience || 'Hiring managers and business owners'}
Offer: ${campaign.offer || 'Recruitment services'}
Problem We Solve: ${campaign.problemSolved || ''}
Main Benefit: ${campaign.mainBenefit || ''}
Proof / Case Study: ${campaign.proofCaseStudy || 'None provided - do NOT invent proof or case studies'}
CTA Type: ${campaign.ctaType || 'Book Discovery Call'}
Booking Link: ${campaign.bookingLink || campaign.ctaLink || ''}
Unsubscribe Line: ${campaign.unsubscribeLine || 'Reply STOP to unsubscribe'}
Tone: ${campaign.tone || 'Professional'}
Language: ${campaign.language || 'English'}
Personalization Level: ${campaign.personalizationLevel || 'Medium'}
Email Length: ${campaign.emailLength || 'Short'}
Spam Safety: ${campaign.spamSafety || 'High'}
CTA Style: ${campaign.ctaStyle || 'Soft'}
`.trim();

    let successCount = 0;
    let failedCount = 0;
    const failedLeads: string[] = [];

    const generateForLead = async (lead: any) => {
      try {
        // Skip if Step 1 already exists (idempotency)
        const existing = await prisma.emailSequence.findFirst({
          where: { campaignId, leadId: lead.id, sequenceStep: 1 }
        });
        if (existing) return { success: false, reason: 'Already generated', skipped: true };

        const proofInstruction = campaign.proofCaseStudy
          ? `Use this proof/case study if relevant: "${campaign.proofCaseStudy}"`
          : `No proof provided. Do NOT invent or fabricate any statistics, client names, testimonials, or case studies.`;

        const prompt = `You are an expert cold email strategist for a recruitment agency.
Write a personalized 5-email outreach sequence for the following prospect.

STRICT RULES:
- Keep each email short (under 100 words for body unless "Detailed" length is specified)
- Sound human and natural, never robotic or template-like
- Use one clear CTA per email
- Never use emojis in professional outreach
- Never invent statistics, client names, testimonials, or results
- Avoid spam trigger words
- Subject line must be under 8 words
- ${proofInstruction}
- If proof/case study is empty, use value-based messaging only
- Include this unsubscribe line in Email 5: "${campaign.unsubscribeLine || 'Reply STOP to unsubscribe'}"
- Language: ${campaign.language || 'English'}
- Tone: ${campaign.tone || 'Professional'}
- CTA Style: ${campaign.ctaStyle || 'Soft'}

[CAMPAIGN CONTEXT]
${campaignContext}

[PROSPECT DETAILS]
Business Name: ${lead.businessName}
Email: ${lead.email || 'Unknown'}
Location: ${lead.location || lead.address || lead.country || 'Unknown'}
Website: ${lead.website || 'Unknown'}
Category/Industry: ${lead.category || 'Unknown'}
AI Insight: ${lead.aiInsight || 'No special insights available'}
Lead Score: ${lead.leadScore || 0}/100
Lead Tier: ${lead.leadTier || 'Cold'}

Return ONLY valid JSON array (no markdown, no backticks, no explanation):
[
  {
    "step": 1,
    "name": "Intro",
    "delay_days": 0,
    "email_type": "Introduction",
    "purpose": "Personalized intro with soft CTA",
    "subject": "Short subject under 8 words",
    "preview_text": "Preview snippet",
    "body": "Email body text",
    "cta_text": "Call to action",
    "cta_link": "${campaign.bookingLink || campaign.ctaLink || ''}",
    "personalization_reason": "Why this is personalized to this lead"
  },
  {
    "step": 2,
    "name": "Follow-up",
    "delay_days": 2,
    "email_type": "Follow-up",
    "purpose": "Follow up and ask one question",
    "subject": "...",
    "preview_text": "...",
    "body": "...",
    "cta_text": "...",
    "cta_link": "${campaign.bookingLink || campaign.ctaLink || ''}",
    "personalization_reason": "..."
  },
  {
    "step": 3,
    "name": "Problem-based",
    "delay_days": 5,
    "email_type": "Problem",
    "purpose": "Address the problem you solve",
    "subject": "...",
    "preview_text": "...",
    "body": "...",
    "cta_text": "...",
    "cta_link": "${campaign.bookingLink || campaign.ctaLink || ''}",
    "personalization_reason": "..."
  },
  {
    "step": 4,
    "name": "Benefit / Proof",
    "delay_days": 8,
    "email_type": "Benefit",
    "purpose": "Highlight benefit or use case study if provided",
    "subject": "...",
    "preview_text": "...",
    "body": "...",
    "cta_text": "...",
    "cta_link": "${campaign.bookingLink || campaign.ctaLink || ''}",
    "personalization_reason": "..."
  },
  {
    "step": 5,
    "name": "Final Follow-up",
    "delay_days": 12,
    "email_type": "Final",
    "purpose": "Respectful last follow-up with unsubscribe option",
    "subject": "...",
    "preview_text": "...",
    "body": "...",
    "cta_text": "...",
    "cta_link": "${campaign.bookingLink || campaign.ctaLink || ''}",
    "personalization_reason": "..."
  }
]`;

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://funnelzenai.com',
            'X-Title': 'FunnelZen AI'
          },
          body: JSON.stringify({
            model: openrouterModel,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        const orData = await res.json();
        if (orData.error) {
          throw new Error(`OpenRouter Error: ${orData.error.message || JSON.stringify(orData.error)}`);
        }
        if (!orData.choices?.[0]?.message?.content) {
          throw new Error('AI returned empty response');
        }

        let jsonStr = orData.choices[0].message.content.trim();
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const startIdx = jsonStr.indexOf('[');
        const endIdx = jsonStr.lastIndexOf(']');
        if (startIdx === -1 || endIdx === -1) throw new Error('AI returned invalid JSON format');
        jsonStr = jsonStr.slice(startIdx, endIdx + 1);

        const sequenceData = JSON.parse(jsonStr);

        if (!Array.isArray(sequenceData) || sequenceData.length === 0) {
          throw new Error('AI returned empty sequence');
        }

        // Save each email step
        for (let seq of sequenceData) {
          // Normalize keys to lowercase just in case the AI capitalized them
          const normalizedSeq: any = {};
          for (const key in seq) {
            normalizedSeq[key.toLowerCase()] = seq[key];
          }
          seq = normalizedSeq;

          if (!seq.subject || !seq.body) continue; // Skip malformed steps

          // Basic spam risk heuristic
          const spamWords = ['free', 'guarantee', 'click here', 'urgent', 'act now', 'limited time', 'winner', 'congratulations'];
          const bodyLower = (seq.body || '').toLowerCase();
          const spamHits = spamWords.filter(w => bodyLower.includes(w)).length;
          const spamRisk = spamHits >= 3 ? 'High' : spamHits >= 1 ? 'Medium' : 'Low';

          // Basic personalization score
          const personalizationScore = lead.aiInsight ? 75 : lead.category ? 60 : 40;

          await prisma.emailSequence.create({
            data: {
              userId: user.id,
              campaignId,
              leadId: lead.id,
              name: seq.name || `Email ${seq.step || 1}`,
              subject: seq.subject,
              previewText: seq.preview_text,
              body: seq.body,
              sequenceStep: parseInt(String(seq.step)) || 1,
              ctaText: seq.cta_text,
              ctaLink: seq.cta_link || campaign.bookingLink || campaign.ctaLink || '',
              delayAmount: parseInt(String(seq.delay_days)) || 0,
              delayUnit: 'business_days',
              status: 'Draft',
              approvalStatus: campaign.autoApproveEmails ? 'Approved' : 'Pending',
              aiOriginalSubject: seq.subject,
              aiOriginalBody: seq.body,
              aiGenerationReason: seq.personalization_reason || 'Generated via AI',
              personalizationScore,
              spamRisk,
              emailType: seq.email_type,
              purpose: seq.purpose,
              personalizationLevel: campaign.personalizationLevel || 'Medium',
              emailLength: campaign.emailLength || 'Short',
              spamSafety: campaign.spamSafety || 'High',
              ctaStyle: campaign.ctaStyle || 'Soft',
              enabled: true,
            }
          });
        }

        // Update campaign lead status
        await prisma.campaignLead.update({
          where: { campaignId_leadId: { campaignId, leadId: lead.id } },
          data: { status: 'Email Generated' }
        }).catch(() => {}); // Don't fail if lead not in campaignLead table

        return { success: true };
      } catch (err: any) {
        console.error('AI Generation failed for lead', lead.id, err);
        return { success: false, reason: err.message, leadId: lead.id };
      }
    };

    const failedDetails: any[] = [];
    
    // Process in small concurrent batches of 5
    const BATCH_SIZE = 5;
    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(generateForLead));
      results.forEach(r => {
        if (r.success) successCount++;
        else if (!r.skipped && r.leadId) {
          failedCount++;
          failedLeads.push(r.leadId);
          failedDetails.push({ leadId: r.leadId, reason: r.reason });
        }
      });
    }

    // Include the first failure reason in the message if it failed completely
    let finalMessage = `AI created ${successCount * 5} drafts for ${successCount} leads.`;
    if (successCount === 0 && failedCount === 0) {
      finalMessage = `All leads already have emails generated. Delete existing drafts to regenerate.`;
    } else if (failedCount > 0) {
      finalMessage += ` ${failedCount} leads failed.`;
    }
    if (successCount === 0 && failedCount > 0 && failedDetails.length > 0) {
      finalMessage += ` Error: ${failedDetails[0].reason}`;
    }

    return NextResponse.json({
      success: true,
      message: finalMessage,
      successCount,
      failedCount,
      totalDrafts: successCount * 5,
      failedLeads,
      failedDetails
    });

  } catch (error: any) {
    console.error('Generate sequence error:', error);
    return NextResponse.json({
      error: 'Something went wrong while generating emails. Please try again.'
    }, { status: 500 });
  }
}
