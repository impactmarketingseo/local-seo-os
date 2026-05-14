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
    console.log('Building prompts...');
    let systemPrompt: string;
    let pageRequest: string;
    try {
      systemPrompt = buildSystemPrompt(client);
      console.log('System prompt built, length:', systemPrompt.length);
      
      pageRequest = buildPageRequest(
        service,
        city,
        allServices as any || [],
        serviceCities as any || []
      );
      console.log('Page request built, length:', pageRequest.length);
    } catch (e) {
      console.error('Error building prompts:', e);
      return NextResponse.json({ error: 'Failed to build prompts', details: String(e) }, { status: 500 });
    }

    // API keys
    const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const cohereKey = process.env.COHERE_API_KEY || process.env.NEXT_PUBLIC_COHERE_API_KEY;
    const togetherKey = process.env.TOGETHER_API_KEY || process.env.NEXT_PUBLIC_TOGETHER_API_KEY;
    console.log('Keys - Groq:', !!groqKey, 'Gemini:', !!geminiKey, 'Cohere:', !!cohereKey, 'Together:', !!togetherKey);

    let content = '';
    let aiModel = 'groq';
    let tokenCount = 0;

    // Model configuration based on user selection
    const groqModelMap: Record<string, { name: string; maxTokens: number; systemLimit: number; pageLimit: number }> = {
      'groq-mixtral': { name: 'mixtral-8x7b-32768', maxTokens: 32000, systemLimit: 4000, pageLimit: 2000 },
      'groq-llama70': { name: 'llama-3.3-70b-versatile', maxTokens: 32000, systemLimit: 4000, pageLimit: 2000 },
      'groq-llama8': { name: 'llama-3.1-8b-instant', maxTokens: 6000, systemLimit: 1500, pageLimit: 800 },
    };
    
    const geminiModelMap: Record<string, { name: string; maxTokens: number }> = {
      'gemini-flash': { name: 'gemini-1.5-flash', maxTokens: 8000 },
      'gemini-flash-002': { name: 'gemini-1.5-flash-002', maxTokens: 8000 },
      'gemini-exp': { name: 'gemini-2.0-flash-exp', maxTokens: 8000 },
    };

    const cohereModelMap: Record<string, { name: string; maxTokens: number; systemLimit: number; pageLimit: number }> = {
      'cohere-command': { name: 'command-r', maxTokens: 16000, systemLimit: 4000, pageLimit: 2000 },
      'cohere-command-plus': { name: 'command-r-plus', maxTokens: 32000, systemLimit: 6000, pageLimit: 3000 },
    };

    const togetherModelMap: Record<string, { name: string; maxTokens: number; systemLimit: number; pageLimit: number }> = {
      'together-llama3': { name: 'meta-llama/Llama-3-70b-chat', maxTokens: 32000, systemLimit: 4000, pageLimit: 2000 },
      'together-mixtral': { name: 'mistralai/Mixtral-8x7b-instruct-v0.1', maxTokens: 32000, systemLimit: 4000, pageLimit: 2000 },
      'together-qwen': { name: 'Qwen/Qwen2-72B-Instruct', maxTokens: 32000, systemLimit: 4000, pageLimit: 2000 },
    };

    // Try Groq with user-selected or fallback models
    if (groqKey && !content) {
      console.log('Attempting Groq API call...');
      
      // Determine which models to try based on user selection
      let groqModelsToTry: { name: string; maxTokens: number; systemLimit: number; pageLimit: number }[] = [];
      
      if (model && groqModelMap[model]) {
        // User selected a specific Groq model - try it first, then fallbacks
        const selected = groqModelMap[model];
        groqModelsToTry = [selected, ...Object.values(groqModelMap).filter(m => m.name !== selected.name)];
      } else {
        // Default: try all models in order of preference (higher limit first)
        groqModelsToTry = Object.values(groqModelMap);
      }
      
      for (const modelConfig of groqModelsToTry) {
        try {
          console.log(`Trying Groq model: ${modelConfig.name}`);
          
          const truncatedSystem = systemPrompt.substring(0, modelConfig.systemLimit);
          const truncatedPage = pageRequest.substring(0, modelConfig.pageLimit);
          
          const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelConfig.name,
              messages: [
                { role: 'system', content: truncatedSystem },
                { role: 'user', content: truncatedPage }
              ],
              max_tokens: Math.min(8000, modelConfig.maxTokens - 1000),
              temperature: 0.7,
            }),
          });

          console.log(`Groq ${modelConfig.name} status:`, groqResponse.status);

          if (groqResponse.ok) {
            const data = await groqResponse.json();
            content = data.choices?.[0]?.message?.content || '';
            tokenCount = data.usage?.total_tokens || 0;
            console.log(`Groq ${modelConfig.name} content length:`, content.length);
            if (content) break;
          } else {
            const errData = await groqResponse.json().catch(() => ({}));
            console.log(`Groq ${modelConfig.name} error:`, errData?.error?.message || 'unknown');
          }
        } catch (e) {
          console.log(`Groq ${modelConfig.name} exception:`, e);
        }
      }
    }

    // Gemini fallback with different models
    if (!content && geminiKey) {
      console.log('Trying Gemini...');
      
      // Determine which models to try based on user selection
      let geminiModelsToTry: { name: string; maxTokens: number }[] = [];
      
      if (model && geminiModelMap[model]) {
        // User selected a specific Gemini model
        const selected = geminiModelMap[model];
        geminiModelsToTry = [selected, ...Object.values(geminiModelMap).filter(m => m.name !== selected.name)];
      } else {
        // Default: try all models
        geminiModelsToTry = Object.values(geminiModelMap);
      }
      
      for (const modelConfig of geminiModelsToTry) {
        try {
          console.log(`Trying Gemini model: ${modelConfig.name}`);
          const prompt = `${systemPrompt.substring(0, 4000)}\n\n${pageRequest.substring(0, 2000)}`;
          
          const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.name}:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: modelConfig.maxTokens },
            }),
          });
          
          if (geminiResponse.ok) {
            const data = await geminiResponse.json();
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            aiModel = 'gemini';
            console.log(`Gemini ${modelConfig.name} content:`, content.length);
            if (content) break;
          } else {
            console.log(`Gemini ${modelConfig.name} status:`, geminiResponse.status);
          }
        } catch (e) {
          console.log(`Gemini ${modelConfig.name} exception:`, e);
        }
      }
    }

    // Try Cohere
    if (!content && cohereKey) {
      console.log('Trying Cohere API...');
      
      let cohereModelsToTry: { name: string; maxTokens: number; systemLimit: number; pageLimit: number }[] = [];
      
      if (model && cohereModelMap[model]) {
        const selected = cohereModelMap[model];
        cohereModelsToTry = [selected, ...Object.values(cohereModelMap).filter(m => m.name !== selected.name)];
      } else {
        cohereModelsToTry = Object.values(cohereModelMap);
      }
      
      for (const modelConfig of cohereModelsToTry) {
        try {
          console.log(`Trying Cohere model: ${modelConfig.name}`);
          const truncatedSystem = systemPrompt.substring(0, modelConfig.systemLimit);
          const truncatedPage = pageRequest.substring(0, modelConfig.pageLimit);
          
          const cohereResponse = await fetch('https://api.cohere.ai/v1/chat', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${cohereKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelConfig.name,
              messages: [
                { role: 'system', content: truncatedSystem },
                { role: 'user', content: truncatedPage }
              ],
              max_tokens: Math.min(8000, modelConfig.maxTokens - 1000),
              temperature: 0.7,
            }),
          });
          
          if (cohereResponse.ok) {
            const data = await cohereResponse.json();
            content = data.text || data.message?.content || '';
            aiModel = 'cohere';
            console.log(`Cohere ${modelConfig.name} content:`, content.length);
            if (content) break;
          } else {
            console.log(`Cohere ${modelConfig.name} status:`, cohereResponse.status);
          }
        } catch (e) {
          console.log(`Cohere ${modelConfig.name} exception:`, e);
        }
      }
    }

    // Try Together AI
    if (!content && togetherKey) {
      console.log('Trying Together AI...');
      
      let togetherModelsToTry: { name: string; maxTokens: number; systemLimit: number; pageLimit: number }[] = [];
      
      if (model && togetherModelMap[model]) {
        const selected = togetherModelMap[model];
        togetherModelsToTry = [selected, ...Object.values(togetherModelMap).filter(m => m.name !== selected.name)];
      } else {
        togetherModelsToTry = Object.values(togetherModelMap);
      }
      
      for (const modelConfig of togetherModelsToTry) {
        try {
          console.log(`Trying Together model: ${modelConfig.name}`);
          const truncatedSystem = systemPrompt.substring(0, modelConfig.systemLimit);
          const truncatedPage = pageRequest.substring(0, modelConfig.pageLimit);
          
          const togetherResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${togetherKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelConfig.name,
              messages: [
                { role: 'system', content: truncatedSystem },
                { role: 'user', content: truncatedPage }
              ],
              max_tokens: Math.min(8000, modelConfig.maxTokens - 1000),
              temperature: 0.7,
            }),
          });
          
          if (togetherResponse.ok) {
            const data = await togetherResponse.json();
            content = data.choices?.[0]?.message?.content || '';
            aiModel = 'together';
            console.log(`Together ${modelConfig.name} content:`, content.length);
            if (content) break;
          } else {
            console.log(`Together ${modelConfig.name} status:`, togetherResponse.status);
          }
        } catch (e) {
          console.log(`Together ${modelConfig.name} exception:`, e);
        }
      }
    }
    
    if (!content) {
      console.log('All APIs failed');
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