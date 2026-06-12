import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openrouterModel = process.env.OPENROUTER_MODEL || "google/gemini-1.5-pro";

  if (!openrouterKey) {
    return NextResponse.json({ error: 'OpenRouter API Key is missing in settings' }, { status: 400 });
  }

  try {
    const existing = await prisma.emailSequence.findUnique({
      where: { id: params.id },
      include: { lead: true, campaign: true }
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { lead, campaign } = existing;

    const prompt = `You are an expert cold email strategist for recruitment agencies.
Rewrite the email for step ${existing.sequenceStep} (${existing.name}) for this lead:
- Business: ${lead.businessName}
- Location: ${lead.location || lead.address || 'Unknown'}
- Category: ${lead.category || 'Unknown'}
- AI insight: ${lead.aiInsight || 'None'}
- Campaign goal: ${campaign.goal || 'Book Discovery Call'}
Make it better, short, and highly personalized. Do not overpromise.

Return ONLY valid JSON with no markdown blocks. Format:
{ "subject": "...", "preview_text": "...", "body": "...", "cta_text": "...", "cta_link": "..." }`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://recruitflow.ai",
        "X-Title": "RecruitFlow AI"
      },
      body: JSON.stringify({
        model: openrouterModel,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const orData = await res.json();
    let jsonStr = orData.choices[0].message.content.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```/g, '').trim();

    const regenData = JSON.parse(jsonStr);

    const updated = await prisma.emailSequence.update({
      where: { id: params.id },
      data: {
        subject: regenData.subject,
        previewText: regenData.preview_text,
        body: regenData.body,
        ctaText: regenData.cta_text,
        ctaLink: regenData.cta_link,
        aiGenerationReason: "Regenerated via UI"
      }
    });

    return NextResponse.json({ success: true, email: updated });
  } catch (error: any) {
    console.error("Regenerate sequence error:", error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
