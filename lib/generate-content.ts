import { buildSystemPrompt, buildPageRequest, parseAIResponse } from '@/app/api/generate/new-prompt';

export async function generateContent(service: any, city: any, client: any, allServices: any[], serviceCities: any[]) {
  const systemPrompt = buildSystemPrompt(client);
  const pageRequest = buildPageRequest(service, city, allServices, serviceCities);

  const shortPrompt = pageRequest.substring(0, 2000);

  console.log('Prompt lengths - system:', systemPrompt.length, 'page:', pageRequest.length);

  const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  console.log('API keys - Groq:', !!groqKey, 'Gemini:', !!geminiKey);

  let content = '';
  let aiModel = 'groq';
  let tokenCount = 0;

  if (groqKey) {
    console.log('Calling Groq...');
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt.substring(0, 2000) },
            { role: 'user', content: shortPrompt }
          ],
          max_tokens: 4000,
          temperature: 0.7,
        }),
      });

      console.log('Groq status:', groqResponse.status);

      if (groqResponse.ok) {
        const data = await groqResponse.json();
        content = data.choices?.[0]?.message?.content || '';
        tokenCount = data.usage?.total_tokens || 0;
        console.log('Groq OK, content:', content.length);
      } else {
        const err = await groqResponse.text();
        console.log('Groq error:', err.substring(0, 200));
      }
    } catch (e) {
      console.log('Groq fail:', e);
    }
  }

  if (!content && geminiKey) {
    console.log('Calling Gemini...');
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`;
      const fullPrompt = `${systemPrompt.substring(0, 2000)}\n\n${shortPrompt}`;
      
      const geminiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      });

      console.log('Gemini status:', geminiResponse.status);

      if (geminiResponse.ok) {
        const data = await geminiResponse.json();
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        aiModel = 'gemini';
        console.log('Gemini OK, content:', content.length);
      } else {
        const err = await geminiResponse.text();
        console.log('Gemini error:', err.substring(0, 200));
      }
    } catch (e) {
      console.log('Gemini fail:', e);
    }
  }

  console.log('Result - hasContent:', !!content, 'length:', content.length);

  if (!content) {
    throw new Error('No content from AI APIs');
  }

  const parsed = parseAIResponse(content);
  return { parsed, aiModel, tokenCount };
}