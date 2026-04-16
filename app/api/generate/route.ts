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
  model?: string;
}

export async function POST(req: NextRequest) {
  try {
    const packet: GenerationPacket = await req.json();
    
    const { queue_item_id, client_id, service_id, city_id, primary_keyword, synonym, niche, brand_voice, cta_preference, banned_phrases, client_name, city, state, phone, email, address, website_url, years_in_business, model } = packet;

    console.log('Generate request:', { queue_item_id, service_id, city_id, primary_keyword, niche, model });
    
    if (!queue_item_id) {
      return NextResponse.json({ error: 'Missing queue_item_id' }, { status: 400 });
    }
    if (!service_id || !city_id || !primary_keyword || !niche) {
      return NextResponse.json({ error: 'Missing required fields', received: { service_id: !!service_id, city_id: !!city_id, primary_keyword: !!primary_keyword, niche: !!niche } }, { status: 400 });
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

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const preferredModel = model || 'groq';
    
    // Try preferred model first
    if (preferredModel === 'groq' && groqKey) {
      try {
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

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          const content = data.choices?.[0]?.message?.content;
          
          if (content) {
            console.log('Groq generation successful');
            return processGeneratedContent(content, data, queue_item_id, client_id, supabase);
          }
        } else {
          const error = await groqResponse.text();
          console.error('Groq error:', error);
        }
      } catch (e) {
        console.error('Groq exception:', e);
      }
    } else if (preferredModel === 'gemini' && geminiKey) {
      console.log('Using Gemini as preferred model...');
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8000 },
          }),
        });

        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (content) {
            console.log('Gemini generation successful');
            return processGeneratedContent(content, data, queue_item_id, client_id, supabase);
          }
        } else {
          const error = await geminiResponse.text();
          console.error('Gemini error:', error);
        }
      } catch (e) {
        console.error('Gemini exception:', e);
      }
    }
    
    // Fallback to other model
    if (preferredModel === 'gemini' && groqKey) {
      console.log('Gemini failed, falling back to Groq...');
      try {
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

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          const content = data.choices?.[0]?.message?.content;
          
          if (content) {
            console.log('Groq fallback successful');
            return processGeneratedContent(content, data, queue_item_id, client_id, supabase);
          }
        }
      } catch (e) {
        console.error('Groq fallback exception:', e);
      }
    } else if (preferredModel === 'groq' && geminiKey) {
      console.log('Groq failed, falling back to Gemini...');
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8000 },
          }),
        });

        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (content) {
            console.log('Gemini fallback successful');
            return processGeneratedContent(content, data, queue_item_id, client_id, supabase);
          }
        }
      } catch (e) {
        console.error('Gemini fallback exception:', e);
      }
    }
    
    // No keys configured
    if (!groqKey && !geminiKey) {
      console.error('No API keys configured');
      await supabase.from('page_queue').update({ status: 'failed', error_message: 'API keys not configured' }).eq('id', queue_item_id);
      return NextResponse.json({ error: 'No AI API keys configured. Add GROQ_API_KEY or GEMINI_API_KEY' }, { status: 500 });
    }
    
    await supabase.from('page_queue').update({ status: 'failed', error_message: 'Both AI models failed' }).eq('id', queue_item_id);
    return NextResponse.json({ error: 'Generation failed with both models' }, { status: 500 });
  } catch (error) {
    console.error('Generation error:', error);
    await supabase.from('page_queue').update({ status: 'failed', error_message: String(error) }).eq('id', queue_item_id);
    return NextResponse.json({ error: 'Generation failed: ' + String(error) }, { status: 500 });
  }
}

async function processGeneratedContent(content: string, data: any, queue_item_id: string, client_id: string, supabase: any) {
  const generatedContent = parseOutput(content);
  
  const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
  const slugMatch = content.match(/"slug"\s*:\s*"([^"]+)"/);
  const metaDescMatch = content.match(/"meta_description"\s*:\s*"([^"]+)"/);
  
  const title = String(generatedContent.title || titleMatch?.[1] || content.substring(0, 50).replace(/\n/g, ' ').trim() || 'Untitled');
  const slug = String(generatedContent.slug || slugMatch?.[1] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  const meta_description = String(generatedContent.meta_description || metaDescMatch?.[1] || content.substring(0, 160).replace(/\n/g, ' ').trim());
  
  const draftData = {
    queue_id: queue_item_id,
    client_id,
    title,
    slug,
    meta_title: String(generatedContent.meta_title || ''),
    meta_description,
    h1: String(generatedContent.h1 || ''),
    intro: String(generatedContent.intro || ''),
    cta_block: String(generatedContent.cta_block || ''),
    additional_keywords: JSON.stringify(generatedContent.additional_keywords || []),
    schema_notes: generatedContent.service_schema || {},
    content_json: generatedContent,
    content_text: content,
    status: 'draft',
    generation_model: 'llama-3.3-70b-versatile',
    token_count: data.usage?.total_tokens || 0,
  };
  
  const { data: draft, error: draftError } = await supabase.from('drafts').insert(draftData).select().single();

  if (draftError) {
    console.error('Draft save error:', draftError);
    return NextResponse.json({ error: 'Failed to save draft', details: draftError.message }, { status: 500 });
  }

  await supabase.from('page_queue').update({ status: 'needs_review' }).eq('id', queue_item_id);

  return NextResponse.json({
    success: true,
    draft_id: draft?.id,
    content: generatedContent,
  });
}