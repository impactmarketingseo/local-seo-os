import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildSystemPrompt, buildPageRequest, parseAIResponse } from '../new-prompt';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GenerationRequest {
  queue_item_id: string;
  service_id: string;
  city_id: string;
  model?: string;
}

export async function POST(req: NextRequest) {
  try {
    const packet: GenerationRequest = await req.json();
    const { queue_item_id, service_id, city_id, model } = packet;

    console.log('Generation request:', { queue_item_id, service_id, city_id });

    if (!queue_item_id || !service_id || !city_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch service, city, and client data
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', city_id)
      .single();

    if (cityError || !city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Get client info
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', service.client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get other services for this client (for internal links)
    const { data: allServices } = await supabase
      .from('services')
      .select('id, name, slug')
      .eq('client_id', service.client_id)
      .eq('active', true);

    // Get cities for this service (for same-service-other-cities)
    const { data: serviceCities } = await supabase
      .from('cities')
      .select('id, name, slug')
      .eq('client_id', service.client_id)
      .eq('active', true);

    // Build prompts
    const systemPrompt = buildSystemPrompt(client);
    const pageRequest = buildPageRequest(
      service,
      city,
      allServices as any || [],
      serviceCities as any || []
    );

    console.log('Building prompts complete');
    console.log('System prompt length:', systemPrompt.length);
    console.log('Page request:', pageRequest.substring(0, 200));

    // Try Groq first
    const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    console.log('Groq key:', !!groqKey, 'Gemini key:', !!geminiKey);
    console.log('System prompt length:', systemPrompt.length);
    console.log('Page request length:', pageRequest.length);

    let content = '';
    let aiModel = 'groq';
    let tokenCount = 0;

    // Try Groq
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
              { role: 'system', content: systemPrompt },
              { role: 'user', content: pageRequest }
            ],
            max_tokens: 8000,
            temperature: 0.7,
          }),
        });

        console.log('Groq status:', groqResponse.status);

        if (!groqResponse.ok) {
          const err = await groqResponse.text();
          console.log('Groq error:', groqResponse.status, err);
        }

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          content = data.choices?.[0]?.message?.content || '';
          tokenCount = data.usage?.total_tokens || 0;
          console.log('Groq content length:', content.length);
        } else {
          // Try Gemini if Groq fails
          if (geminiKey) {
            console.log('Trying Gemini...');
            const prompt = `${systemPrompt}\n\n${pageRequest}`;
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 8000 },
              }),
            });
            console.log('Gemini status:', geminiResponse.status);
            if (!geminiResponse.ok) {
              const err = await geminiResponse.text();
              console.log('Gemini error:', err);
            }
            if (geminiResponse.ok) {
              const data = await geminiResponse.json();
              content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              aiModel = 'gemini';
              console.log('Gemini content:', content.length);
            }
          }
        }
      } catch (e) {
        console.log('Groq exception:', e);
      }
    }

    // Gemini fallback if no groq key
    if (!content && geminiKey) {
      console.log('Trying Gemini directly...');
      try {
        const prompt = `${systemPrompt}\n\n${pageRequest}`;
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8000 },
          }),
        });
        console.log('Gemini direct status:', geminiResponse.status);
        if (!geminiResponse.ok) {
          const err = await geminiResponse.text();
          console.log('Gemini direct error:', err);
        }
        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          aiModel = 'gemini';
          console.log('Gemini direct content:', content.length);
        } else {
          const err = await geminiResponse.text();
          console.log('Gemini direct error:', err.substring(0, 200));
        }
      } catch (e) {
        console.log('Gemini direct exception:', e);
      }
    }
    
    if (!content) {
      console.log('Both APIs failed');
      return NextResponse.json({ error: 'AI generation failed', details: 'No content from AI API' }, { status: 500 });
    }
    
    // Parse the JSON response
    let parsed;
    try {
      parsed = parseAIResponse(content);
    } catch (e) {
      console.error('Parse error:', e);
      await supabase.from('page_queue').update({ status: 'planned' }).eq('id', queue_item_id);
      return NextResponse.json({ error: 'Failed to parse AI response', details: (e as Error).message }, { status: 500 });
    }

    // Log what sections we got
    console.log('Parsed sections:', Object.keys(parsed || {}));
    console.log('Has problems:', !!parsed?.problems);
    console.log('Has why_choose_us:', !!parsed?.why_choose_us);
    console.log('Has process:', !!parsed?.process);
    console.log('Has faq:', !!parsed?.faq);

    // Create draft record
    let finalDraft = null;
    
    // Must include content_json (NOT NULL in production)
    const insertData: any = { 
      status: 'draft',
      generation_model: aiModel,
      content_json: parsed // Store actual content
    };
    if (service?.client_id) insertData.client_id = service.client_id;
    
    console.log('Inserting draft with:', insertData);
    
    const draftInsert = await supabase.from('drafts').insert(insertData).select().single();
    
    if (draftInsert.data) {
      finalDraft = draftInsert.data;
      console.log('Draft created:', finalDraft.id);
    } else {
      console.log('Draft insert failed:', draftInsert.error);
      return NextResponse.json({ error: 'Failed to create draft', details: draftInsert.error?.message }, { status: 500 });
    }

    // Also insert into draft_content table for compatibility
    const { error: contentError } = await supabase.from('draft_content').insert({
      draft_id: finalDraft.id,
      meta: parsed.meta || {},
      breadcrumb: parsed.breadcrumb || '',
      hero: parsed.hero || {},
      trust_strip: parsed.trust_strip || [],
      problems: parsed.problems || {},
      why_choose_us: parsed.why_choose_us || {},
      process: parsed.process || {},
      faq: parsed.faq || {},
      local_context: parsed.local_context || {},
      internal_links: parsed.internal_links || {},
      final_cta: parsed.final_cta || {},
      schema_markup: parsed.schema_markup || {},
    });

    console.log('Content insert result:', contentError ? 'ERROR: ' + contentError.message : 'OK');

    // Update queue status
    await supabase.from('page_queue').update({
      status: 'draft_ready',
    }).eq('id', queue_item_id).then(({ error }) => {
      if (error) console.log('Queue update error:', error.message);
    });

    // Log generation
    await supabase.from('generation_logs').insert({
      queue_id: queue_item_id,
      draft_id: finalDraft.id,
      status: 'success',
      token_count: tokenCount,
    }).then(({ error }) => {
      if (error) console.log('Log insert error:', error.message);
    });

    return NextResponse.json({ success: true, draft_id: finalDraft.id });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}