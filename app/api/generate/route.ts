import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildPrompt, parseOutput } from './utils';

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
  years_in_business?: string;
}

export async function POST(req: NextRequest) {
  let queue_item_id = '';
  
  try {
    const packet: GenerationPacket = await req.json();
    
    queue_item_id = packet.queue_item_id;
    const { client_id, service_id, city_id, primary_keyword, synonym, niche, brand_voice, cta_preference, banned_phrases, client_name, city, state, phone, email, address, website_url, years_in_business } = packet;

    console.log('Generate request:', { queue_item_id, service_id, city_id, primary_keyword, niche, years_in_business });
    
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
      years_in_business: years_in_business || '',
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
        max_tokens: 8000,
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
    
    console.log('Parsed content:', JSON.stringify(generatedContent, null, 2));
    console.log('Raw content sample:', content.substring(0, 500));
    
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
    
    const title = generatedContent.title || titleMatch?.[1] || mdTitleMatch?.[1] || content.substring(0, 50).replace(/\n/g, ' ').trim() || 'Untitled';
    const slug = generatedContent.slug || slugMatch?.[1] || mdSlugMatch?.[1]?.replace(/^\//, '').replace(/\/$/, '') || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const h1 = generatedContent.h1 || h1Match?.[1] || mdH1Match?.[1] || '';
    const meta_title = generatedContent.meta_title || metaTitleMatch?.[1] || '';
    const meta_description = generatedContent.meta_description || metaDescMatch?.[1] || mdMetaDescMatch?.[1] || content.substring(0, 160).replace(/\n/g, ' ').trim();
    const intro = generatedContent.intro || introMatch?.[1] || '';
    const cta_block = generatedContent.cta_block || generatedContent.cta || ctaMatch?.[1] || '';
    const additional_keywords = generatedContent.additional_keywords || [];
    const schema_notes = generatedContent.schema_notes || {};
    const service_schema = generatedContent.service_schema || {};
    const local_business_schema = generatedContent.local_business_schema || {};
    
    const hero = generatedContent.hero || '';
    const sections = (generatedContent.sections as any[]) || [];
    const faqs = (generatedContent.faqs as any[]) || [];
    
    console.log('Extracted fields:', { title, slug, h1, meta_title, meta_description: meta_description?.substring(0, 50), sections: sections.length, faqs: faqs.length });
    
    const draftData: Record<string, unknown> = {
      queue_id: queue_item_id,
      client_id,
      title: title,
      slug: slug,
      meta_title: meta_title,
      meta_description: meta_description,
      h1: h1,
      intro: intro,
      cta_block: cta_block,
      additional_keywords: JSON.stringify(additional_keywords),
      schema_notes: service_schema,
      content_json: generatedContent,
      content_text: content,
      status: 'draft',
      generation_model: 'llama-3.3-70b-versatile',
      token_count: data.usage?.total_tokens || 0,
    };
    
    const { data: draft, error: draftError } = await supabase.from('drafts').insert(draftData).select().single();

    console.log('Draft insert result:', { draft, draftError });
    
    if (draftError) {
      console.error('Draft save error:', draftError);
      return NextResponse.json({ error: 'Failed to save draft', details: draftError.message }, { status: 500 });
    }

    await supabase.from('page_queue').update({ status: 'needs_review' }).eq('id', queue_item_id);

    if (draft && draft.id) {
      await supabase.from('generation_logs').insert({
        queue_id: queue_item_id,
        draft_id: draft.id,
        status: 'success',
        token_count: data.usage?.total_tokens || 0,
      });
    }

    return NextResponse.json({
      success: true,
      draft_id: draft?.id,
      content: generatedContent,
    });
  } catch (error) {
    console.error('Generation error:', error);
    await supabase.from('page_queue').update({ status: 'failed' }).eq('id', queue_item_id);
    return NextResponse.json({ error: 'Generation failed: ' + String(error) }, { status: 500 });
  }
}