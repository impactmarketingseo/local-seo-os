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
  client_name?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  address?: string;
  website_url?: string;
}

export async function POST(req: NextRequest) {
  try {
    const packet: GenerationPacket = await req.json();
    
    const { queue_item_id, client_id, service_id, city_id, primary_keyword, synonym, niche, brand_voice, cta_preference, banned_phrases, client_name, city, state, phone, email, address, website_url } = packet;

    console.log('Generate request:', { queue_item_id, service_id, city_id, primary_keyword, niche });
    
    // Validate IDs are not empty strings
    if (!queue_item_id || !service_id || !city_id || !primary_keyword || !niche) {
      console.error('Missing fields:', { queue_item_id, service_id, city_id, primary_keyword, niche });
      return NextResponse.json({ error: 'Missing required fields', received: { queue_item_id, service_id, city_id, primary_keyword, niche } }, { status: 400 });
    }

    await supabase.from('page_queue').update({ status: 'generating' }).eq('id', queue_item_id);

    const prompt = buildPrompt({
      niche,
      brand_voice: brand_voice || '',
      cta_preference: cta_preference || 'Call now for a free quote',
      banned_phrases: banned_phrases || [],
      keyword: primary_keyword,
      synonym,
      client_name: client_name || '',
      city: city || '',
      state: state || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      website_url: website_url || '',
    });

    // Use Groq API (OpenAI-compatible)
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.error('GROQ_API_KEY not set');
      await supabase.from('page_queue').update({ status: 'approved' }).eq('id', queue_item_id);
      return NextResponse.json({ error: 'GROQ_API_KEY not configured in environment' }, { status: 500 });
    }
    
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4500,
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
    const contentText = content;
    
    // Extract fields from JSON code blocks
    const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
    const slugMatch = content.match(/"slug"\s*:\s*"([^"]+)"/);
    const h1Match = content.match(/"h1"\s*:\s*"([^"]+)"/);
    const metaTitleMatch = content.match(/"meta_title"\s*:\s*"([^"]+)"/);
    const metaDescMatch = content.match(/"meta_description"\s*:\s*"([^"]+)"/);
    const introMatch = content.match(/"intro"\s*:\s*"([^"]+)"/);
    const ctaMatch = content.match(/"cta"\s*:\s*"([^"]+)"/);
    
    // Extract from Markdown-style format (**Title:**, etc.)
    const mdTitleMatch = content.match(/\*\*Title\*\*:\s*([^\n]+)/);
    const mdSlugMatch = content.match(/\*\*URL Slug\*\*:\s*([^\n]+)/);
    const mdH1Match = content.match(/<h1>([^<]+)<\/h1>/);
    const mdMetaDescMatch = content.match(/\*\*Meta Description\*\*:\s*([^\n]+)/);
    
    const title = generatedContent.title || (titleMatch ? titleMatch[1] : (mdTitleMatch ? mdTitleMatch[1].trim() : 'Untitled'));
    const slug = generatedContent.slug || (slugMatch ? slugMatch[1] : (mdSlugMatch ? mdSlugMatch[1].trim().replace(/^\//, '').replace(/\/$/, '') : ''));
    const h1 = generatedContent.h1 || (h1Match ? h1Match[1] : (mdH1Match ? mdH1Match[1].trim() : ''));
    const meta_title = generatedContent.meta_title || (metaTitleMatch ? metaTitleMatch[1] : '');
    const meta_description = generatedContent.meta_description || (metaDescMatch ? metaDescMatch[1] : (mdMetaDescMatch ? mdMetaDescMatch[1].trim() : ''));
const intro = generatedContent.intro || (introMatch ? introMatch[1] : '');
    const cta_block = generatedContent.cta_block || generatedContent.cta || (ctaMatch ? ctaMatch[1] : '');
    const additional_keywords = generatedContent.additional_keywords || [];
    const schema_notes = generatedContent.schema_notes || {};
    
    const { data: draft, error: draftError } = await supabase.from('drafts').insert({
      queue_id: queue_item_id,
      client_id,
      title: title,
      slug: slug,
      meta_title: meta_title,
      meta_description: meta_description,
      h1: h1,
      intro: intro,
      sections: generatedContent.sections || [],
      faqs: generatedContent.faqs || [],
      cta_block: cta_block,
      internal_links: generatedContent.internal_links || [],
      additional_keywords: additional_keywords,
      schema_notes: schema_notes,
      content_json: generatedContent,
      content_text: content,
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
  client_name: string;
  city: string;
  state: string;
  phone?: string;
  email?: string;
  address?: string;
  website_url?: string;
}): string {
  const bannedList = params.banned_phrases.length > 0 
    ? `Avoid these phrases: ${params.banned_phrases.join(', ')}` 
    : '';

  return `You are an expert SEO content writer for local service businesses. Write a complete 1800-2000 word city+service landing page for "${params.keyword}".

CLIENT: ${params.client_name || 'A local ' + params.niche + ' company'}
LOCATION: ${params.city}, ${params.state}
NICHE: ${params.niche}
BRAND VOICE: ${params.brand_voice || 'Professional, friendly, expert'}
CTA: ${params.cta_preference}
PHONE: ${params.phone || 'NO PHONE'}
EMAIL: ${params.email || 'NO EMAIL'}
ADDRESS: ${params.address || 'NO ADDRESS'}
WEBSITE: ${params.website_url || 'NO WEBSITE'}
${bannedList}

CRITICAL REQUIREMENTS:
1. ALWAYS use EXACTLY this phone number in all CTAs: "${params.phone || 'NO PHONE'}" - NEVER use any other phone number
2. ALWAYS mention the business name "${params.client_name}" naturally throughout the content - NOT "At ${params.city} ${params.niche}" - use the actual business name
3. Write unique, substantive content - every paragraph must earn its place
4. Include specific local references: neighborhood names, local landmarks, city-specific conditions
5. Use FAQPage Schema markup for the FAQ section
6. Use LocalBusiness + Service + FAQPage schema in JSON-LD format

PAGE STRUCTURE (follow exactly):

1. HERO: 40-70 words with H1, subheadline, two CTAs
2. TRUST SIGNALS BAR: icons with labels (years, license, reviews, guarantee, response time)
3. LOCAL INTRO: 150-200 words - 2 paragraphs establishing local presence
4. PROBLEM SECTION: 250-350 words - H2 about city-specific problems (housing stock, climate, geography)
5. TYPES/SYMPTOMS: 300-400 words - H2 with 3-5 H3 subsections
6. WARNING SIGNS: 150-200 words - checklist of 5-7 symptoms
7. OUR PROCESS: 250-300 words - 5 numbered steps
8. MID-PAGE CTA: 30-40 words - conversion block
9. WHY LOCAL: 200-250 words - why local expertise matters
10. DIY VS PRO: 150-200 words + comparison table
11. FAQS: 250-350 words - minimum 5 FAQs with city-specific questions
12. FINAL CTA: 40-60 words - confident close

SEO REQUIREMENTS:
- Title: "[Service] in [City], [State] | [Brand Name]" (60 chars max)
- Meta: Include phone number, trigger urgency (160 chars max)  
- URL slug: /service-city-state/ format
- H1 exactly: "[Service] in [City], [State]"

OUTPUT JSON:
{
  "title": "...",
  "slug": "ac-repair-riverton-ut",
  "meta_title": "AC Repair in Riverton, UT | ABC Heating",
  "meta_description": "Expert AC repair in Riverton. Same-day service, 5-year warranty. Call ${params.phone || '(555) 123-4567'}.",
  "h1": "AC Repair in Riverton, Utah",
  "additional_keywords": ["AC repair near me", "emergency AC repair Riverton UT", "AC installation Riverton", "AC maintenance Riverton"],
  "schema_notes": {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "${params.client_name}",
    "image": "${params.website_url}/logo.png",
    "telephone": "${params.phone}",
    "email": "${params.email}",
    "url": "${params.website_url}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "${params.address}",
      "addressLocality": "${params.city}",
      "addressRegion": "${params.state}",
      "postalCode": "REPLACE_WITH_POSTAL_CODE"
    },
    "areaServed": {
      "@type": "State",
      "name": "${params.state}"
    },
    "priceRange": "$$",
    "openingHours": "Mo-Fr 08:00-18:00, Sa 09:00-14:00",
    "serviceType": "${params.niche}",
    "description": "Professional ${params.niche} services in ${params.city}, ${params.state}. Call ${params.phone} for expert service."
  }
}
}
}

Write in human tone - vary sentence length, use contractions, avoid AI filler words (crucial, comprehensive, leverage, foster, pivotal). Include specific city details.`;

}

function parseOutput(text: string): Record<string, unknown> {
  try {
    // Try to find JSON in code blocks first
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Try to find JSON object directly
    const jsonObjMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjMatch) {
      return JSON.parse(jsonObjMatch[0]);
    }
    
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