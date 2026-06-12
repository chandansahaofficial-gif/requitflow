import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { fromEmail, toEmail, subject, body, messageId } = await req.json();

    // Find the lead by email
    const lead = await prisma.lead.findFirst({
      where: { email: fromEmail }
    });

    if (!lead) {
      return NextResponse.json({ success: true, message: 'Ignored: No matching lead found' });
    }

    // Stop future emails
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'Replied' }
    });

    if (lead.campaignId) {
      await prisma.campaignLead.update({
        where: { campaignId_leadId: { campaignId: lead.campaignId, leadId: lead.id } },
        data: { status: 'Replied' }
      });
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openrouterModel = process.env.OPENROUTER_MODEL || "google/gemini-1.5-pro";

    let aiCategory = "Unknown";
    let aiSuggestedReply = "";
    let shouldAutoSend = false;
    let recommendedAction = "Review manually";

    if (openrouterKey) {
      const prompt = `You are an AI sales assistant for a recruitment agency.
Analyze the lead reply and classify it into one of these categories:
Interested, Not Interested, Ask Price, Ask Details, Book Call, Objection, Wrong Person, Out of Office, Angry Reply, Unsubscribe Request.

Reply Context:
From: ${fromEmail}
Subject: ${subject}
Body: ${body}

Rules:
- If interested, move toward booking a discovery call.
- If asks price, give short context and suggest a call.
- If asks details, answer clearly.
- If objection, handle softly.
- If not interested, reply politely and stop follow-up.
- If unsubscribe, confirm removal and stop all emails.
- If angry, do not auto-send. Require human approval.

Return JSON EXACTLY in this format, with no markdown formatting around it:
  "category": "...",
  "suggested_reply": "...",
  "recommended_action": "...",
  "should_auto_send": true,
  "return_date": "YYYY-MM-DD or null if not stated (only for Out of Office)"
}`;

      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openrouterKey}`,
            "Content-Type": "application/json"
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

        const aiResult = JSON.parse(jsonStr);
        aiCategory = aiResult.category;
        aiSuggestedReply = aiResult.suggested_reply;
        recommendedAction = aiResult.recommended_action;
        shouldAutoSend = aiResult.should_auto_send;
        
        if (aiCategory === 'Angry Reply' || aiCategory === 'Unsubscribe Request') {
          shouldAutoSend = false;
        }

        // --- OOO Handling ---
        if (aiCategory === 'Out of Office') {
          const returnDateStr = aiResult.return_date;
          let newScheduledAt = new Date();
          if (returnDateStr && returnDateStr !== 'null') {
            const parsedDate = new Date(returnDateStr);
            if (!isNaN(parsedDate.getTime())) {
              // Add 1 day buffer to their return date
              newScheduledAt = new Date(parsedDate.getTime() + 24 * 60 * 60 * 1000);
            } else {
              newScheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days fallback
            }
          } else {
            newScheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days fallback
          }

          // Find the next scheduled email and delay it
          const nextEmail = await prisma.emailSequence.findFirst({
            where: { leadId: lead.id, status: 'Scheduled' },
            orderBy: { sequenceStep: 'asc' }
          });

          if (nextEmail) {
            await prisma.emailSequence.update({
              where: { id: nextEmail.id },
              data: {
                scheduledAt: newScheduledAt,
                timingReason: `Rescheduled due to Out-of-Office reply. Planned return date: ${returnDateStr || 'Unknown'}`,
                status: 'Draft', // Pause it
                approvalStatus: 'Pending'
              }
            });
            await prisma.aIActionLog.create({
              data: {
                userId: lead.userId,
                campaignId: lead.campaignId,
                leadId: lead.id,
                actionType: 'OOO_RESCHEDULE',
                decision: 'Paused and rescheduled next email',
                inputSummary: JSON.stringify({ reply: body }),
                outputSummary: JSON.stringify({ newDate: newScheduledAt })
              }
            });
          }
        }

      } catch (err) {
        console.error("OpenRouter classification failed", err);
      }
    }

    if (aiCategory === 'Unsubscribe Request') {
      await prisma.unsubscribeList.upsert({
        where: { userId_email: { userId: lead.userId, email: fromEmail } },
        update: { reason: body.substring(0, 100) },
        create: { userId: lead.userId, email: fromEmail, reason: body.substring(0, 100) }
      });
    }

    await prisma.emailReply.create({
      data: {
        campaignId: lead.campaignId,
        leadId: lead.id,
        emailBody: body,
        aiCategory,
        aiSuggestedReply,
        recommendedAction,
        shouldAutoSend,
        status: 'Unread'
      }
    });

    return NextResponse.json({ success: true, aiCategory });
  } catch (error: any) {
    console.error("Webhook Reply Error:", error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
