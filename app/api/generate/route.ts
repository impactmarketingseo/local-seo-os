import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GenerationPacket {
  queue_item_id: string;
  client_id: string;
  service_id: string;
  city_id: string;
  primary_keyword: string;
  synonym?: string;
  niche: string;
  brand_voice?: string;
  cta_preference?: string;
  banned_phrases?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const packet: GenerationPacket = await req.json();
    
    const { queue_item_id, client_id, service_id, city_id, primary_keyword, synonym, niche, brand_voice, cta_preference, banned_phrases } = packet;

    if (!queue_item_id || !service_id || !city_id || !primary_keyword || !niche) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await supabase.from('page_queue').update({ status: 'generating' }).eq('id', queue_item_id);

    const prompt = buildPrompt({
      niche,
      brand_voice: brand_voice || '',
      cta_preference: cta_preference || 'Call now for a free quote',
      banned_phrases: banned_phrases || [],
      keyword: primary_keyword,
      synonym,
    });

    // Use Groq API (OpenAI-compatible)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      console.error('Groq error:', error);
      await supabase.from('page_queue').update({ status: 'draft_ready' }).eq('id', queue_item_id);
      return NextResponse.json({ error: 'Groq API failed' }, { status: 500 });
    }

    const data = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      await supabase.from('page_queue').update({ status: 'draft_ready' }).eq('id', queue_item_id);
      return NextResponse.json({ error: 'Invalid response from Groq' }, { status: 500 });
    }

    const generatedContent = parseOutput(content);
    const contentText = generateReadableText(generatedContent);

    const { data: draft, error: draftError } = await supabase.from('drafts').insert({
      queue_id: queue_item_id,
      client_id,
      title: generatedContent.title || 'Untitled',
      slug: generatedContent.slug,
      meta_title: generatedContent.meta_title,
      meta_description: generatedContent.meta_description,
      h1: generatedContent.h1,
      intro: generatedContent.intro,
      sections: generatedContent.sections || [],
      faqs: generatedContent.faqs || [],
      cta_block: generatedContent.cta,
      internal_links: generatedContent.internal_links || [],
      schema_notes: generatedContent.schema_notes || {},
      content_json: generatedContent,
      content_text: contentText,
      status: 'draft',
      generation_model: 'llama-3.3-70b-versatile',
      token_count: data.usage?.total_tokens || 0,
    }).select().single();

    if (draftError) {
      console.error('Draft save error:', draftError);
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
    }

    await supabase.from('page_queue').update({ status: 'needs_review' }).eq('id', queue_item_id);

    await supabase.from('generation_logs').insert({
      queue_id: queue_item_id,
      draft_id: draft.id,
      status: 'success',
      token_count: data.usage?.total_tokens || 0,
    });

    return NextResponse.json({
      success: true,
      draft_id: draft.id,
      content: generatedContent,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

function buildPrompt(params: {
  niche: string;
  brand_voice: string;
  cta_preference: string;
  banned_phrases: string[];
  keyword: string;
  synonym?: string;
}): string {
  const bannedList = params.banned_phrases.length > 0 
    ? `Avoid these phrases: ${params.banned_phrases.join(', ')}` 
    : '';

  return `You are a professional SEO content writer specializing in local ${params.niche} service businesses.

Write a complete 1800-2000 word SEO city+service page optimized for the keyword "${params.keyword}"${params.synonym ? ` (also consider: "${params.synonym}")` : ''}.

CONTEXT:
- Business niche: ${params.niche}
- Brand voice: ${params.brand_voice || 'Professional, friendly, trustworthy'}
- CTA style: ${params.cta_preference}
- ${bannedList}

REQUIRED OUTPUT STRUCTURE (JSON):
{
  "title": "Keyword | Service in City, State | Company Name",
  "meta_title": "Keyword in City, State | Company - Service",
  "meta_description": "Compelling 150-160 char description with keyword",
  "slug": "service-city-state",
  "h1": "Service in City, State",
  "intro": "2-3 paragraph introduction with local context",
  "sections": [
    {"heading": "Section title", "content": "Paragraphs of content", "order": 1},
    ...
  ],
  "faqs": [
    {"question": "Common question", "answer": "Helpful answer"},
    ...
  ],
  "cta": "Call to action block",
  "internal_links": [{"title": "Link text", "url": "/service-city"}],
  "schema_notes": {"@type": "LocalBusiness", ...}
}

GUIDELINES:
1. Write in a natural, human tone - not robotic or over-optimized
2. Include local city/area context naturally throughout
3. Use the primary keyword in H1, intro, and at least 2 section headings
4. Include 4-6 FAQs relevant to the service and local area
5. Keep secondary keywords to 2-3 mentions max each
6. Write for both customers and search engines
7. Format as proper JSON with no markdown code fences`;

}

function parseOutput(text: string): Record<string, unknown> {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      title: 'Generated Content',
      content_text: text,
      sections: [],
      faqs: [],
    };
  }
}

function generateReadableText(content: Record<string, unknown>): string {
  let text = '';
  
  if (content.intro) text += content.intro + '\n\n';
  
  if (content.sections && Array.isArray(content.sections)) {
    for (const section of content.sections as { heading: string; content: string }[]) {
      text += `## ${section.heading}\n${section.content}\n\n`;
    }
  }
  
  if (content.faqs && Array.isArray(content.faqs)) {
    text += '## Frequently Asked Questions\n\n';
    for (const faq of content.faqs as { question: string; answer: string }[]) {
      text += `### ${faq.question}\n${faq.answer}\n\n`;
    }
  }
  
  if (content.cta) text += `## Contact Us\n${content.cta}\n`;
  
  return text;
}