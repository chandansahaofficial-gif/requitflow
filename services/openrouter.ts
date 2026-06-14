export async function generateText(apiKey: string, prompt: string, model: string = 'openai/gpt-4o-mini') {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      'X-Title': 'FunnelZen AI',
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenRouter generation failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function generateLeadInsight(apiKey: string, lead: any) {
  const prompt = `You are an expert sales assistant for a recruitment agency. Look at this local business lead from Google Maps:
Name: ${lead.businessName}
Category: ${lead.category || 'Unknown'}
Rating: ${lead.rating || 'None'}
Address: ${lead.address || 'Unknown'}

Write one short, personalized, professional sentence (under 20 words) explaining why they might be a good fit for recruitment support, candidate communication automation, or staffing services. Don't use quotes.`;

  return generateText(apiKey, prompt);
}
