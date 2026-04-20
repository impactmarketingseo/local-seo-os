import { buildSystemPrompt, buildPageRequest, parseAIResponse } from '@/app/api/generate/new-prompt';

export async function generateContent(service: any, city: any, client: any, allServices: any[], serviceCities: any[]) {
  const systemPrompt = buildSystemPrompt(client);
  const pageRequest = buildPageRequest(service, city, allServices, serviceCities);

  console.log('System prompt length:', systemPrompt.length);
  console.log('Page request length:', pageRequest.length);
  console.log('Client:', client?.name, client?.phone, client?.email);

  const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  console.log('GROQ_API_KEY set:', !!groqKey, 'length:', groqKey?.length);
  console.log('GEMINI_API_KEY set:', !!geminiKey, 'length:', geminiKey?.length);

  let content = '';
  let aiModel = 'groq';
  let tokenCount = 0;

  if (groqKey) {
    console.log('Calling Groq API...');
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: pageRequest }
          ],
          max_tokens: 10000,
          temperature: 0.7,
        }),
      });

      console.log('Groq response status:', groqResponse.status);

      if (groqResponse.ok) {
        const data = await groqResponse.json();
        content = data.choices?.[0]?.message?.content || '';
        tokenCount = data.usage?.total_tokens || 0;
        console.log('Groq success, content length:', content.length);
      } else {
        const err = await groqResponse.text();
        console.error('Groq error response:', err.substring(0, 500));
      }
    } catch (e) {
      console.error('Groq fetch error:', e);
    }
  }

  if (!content && geminiKey) {
    console.log('Trying Gemini API...');
    try {
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${pageRequest}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 10000 },
        }),
      });

      if (geminiResponse.ok) {
        const data = await geminiResponse.json();
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        aiModel = 'gemini';
        console.log('Gemini success, content length:', content.length);
      }
    } catch (e) {
      console.error('Gemini fetch error:', e);
    }
  }

  if (!content) {
    throw new Error('No content from AI APIs - check API keys are set');
  }

  const parsed = parseAIResponse(content);
  return { parsed, aiModel, tokenCount };
}