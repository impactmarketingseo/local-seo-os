import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildSystemPrompt, buildPageRequest, parseAIResponse, validateOutput, ANTI_PATTERNS } from '../new-prompt';

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
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const useModel = model || 'groq';

    console.log('Using model:', useModel, 'Groq key:', !!groqKey, 'Gemini key:', !!geminiKey);

    let content = '';
    let aiModel = 'groq';
    let tokenCount = 0;

    if (useModel === 'groq' && groqKey) {
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

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          content = data.choices?.[0]?.message?.content || '';
          tokenCount = data.usage?.total_tokens || 0;
          console.log('Groq generation successful, content length:', content.length);
        } else {
          const err = await groqResponse.text();
          console.error('Groq error:', groqResponse.status, err);
        }
      } catch (e) {
        console.error('Groq exception:', e);
      }
    }

    // Fallback to Gemini
    if (!content && geminiKey) {
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${pageRequest}` }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 10000,
            },
          }),
        });

        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          aiModel = 'gemini';
        }
      } catch (e) {
        console.error('Gemini exception:', e);
      }
    }

    if (!content) {
      console.error('AI generation failed - no content returned');
      console.error('Groq key exists:', !!groqKey);
      console.error('Gemini key exists:', !!geminiKey);
      await supabase.from('page_queue').update({ status: 'planned' }).eq('id', queue_item_id);
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

    // Validate output
    const validationErrors = validateOutput(parsed);
    if (validationErrors.length > 0) {
      console.warn('Validation warnings:', validationErrors);
    }

    // Create draft record
    const { data: draft, error: draftError } = await supabase
      .from('drafts')
      .insert({
        queue_id: queue_item_id,
        client_id: service.client_id,
        service_id,
        city_id,
        status: 'draft',
        generation_model: aiModel,
        token_count: tokenCount,
      })
      .select()
      .single();

    if (draftError || !draft) {
      console.error('Draft create error:', draftError);
      return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
    }

    // Insert draft content
    const { error: contentError } = await supabase
      .from('draft_content')
      .insert({
        draft_id: draft.id,
        meta: parsed.meta,
        breadcrumb: parsed.breadcrumb,
        hero: parsed.hero,
        trust_strip: parsed.trust_strip,
        problems: parsed.problems,
        why_choose_us: parsed.why_choose_us,
        process: parsed.process,
        faq: parsed.faq,
        local_context: parsed.local_context,
        internal_links: parsed.internal_links,
        final_cta: parsed.final_cta,
        schema_markup: parsed.schema_markup,
      });

    if (contentError) {
      console.error('Content insert error:', contentError);
    }

    // Update queue status
    await supabase.from('page_queue').update({
      status: 'draft_ready',
    }).eq('id', queue_item_id);

    // Log generation
    await supabase.from('generation_logs').insert({
      queue_id: queue_item_id,
      draft_id: draft.id,
      status: 'success',
      token_count: tokenCount,
    });

    return NextResponse.json({
      success: true,
      draft_id: draft.id,
      validation_warnings: validationErrors,
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}