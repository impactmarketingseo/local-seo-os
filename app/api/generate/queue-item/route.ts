import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateContent } from '@/lib/generate-content';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { queue_item_id, regenerate, model } = await req.json();

    console.log('Queue-item generate request:', { queue_item_id, regenerate, model });
    
    if (!queue_item_id) {
      return NextResponse.json({ error: 'Missing queue_item_id' }, { status: 400 });
    }

    // If regenerating, update status but don't require new queue item
    if (regenerate) {
      await supabase.from('page_queue').update({ status: 'generating' }).eq('id', queue_item_id);
    }

    const { data: queueItem, error: queueError } = await supabase
      .from('page_queue')
      .select(`
        *,
        services(name, slug),
        cities(name, state, slug, population, county, landmarks, neighborhoods, climate_detail, housing_detail),
        clients(id, name, short_name, niche, phone, email, address, website_url, years_in_business, jobs_completed, rating, review_count, owner_name, brands_serviced, financing, emergency_hours, contact_url, services_url, credentials, differentiators, service_area_cities, voice_notes, cta_preference, banned_phrases)
      `)
      .eq('id', queue_item_id)
      .single();

    console.log('Queue item query result:', { queueItem, queueError });
    
    if (queueError || !queueItem) {
      console.error('Queue item query error:', queueError);
      console.log('Searching for queue_item_id:', queue_item_id);
      
      // Try a direct query to check if the item exists
      const { data: directCheck, error: directError } = await supabase
        .from('page_queue')
        .select('id, client_id, service_id, city_id')
        .eq('id', queue_item_id)
        .maybeSingle();
      
      console.log('Direct check result:', { directCheck, directError });
      
      return NextResponse.json({ 
        error: 'Queue item not found', 
        details: queueError?.message,
        searched_id: queue_item_id,
        direct_found: !!directCheck
      }, { status: 404 });
    }

    console.log('Queue item details:', {
      service_id: queueItem.service_id,
      city_id: queueItem.city_id,
      services: queueItem.services,
      cities: queueItem.cities
});
    
    // Log the queue item
    const client = queueItem.clients as any;
    const service = queueItem.services as any;
    const city = queueItem.cities as any;

    console.log('Queue item:', { service_id: queueItem.service_id, city_id: queueItem.city_id, service, city, client });

    // Get other services for this client
    const { data: allServices } = await supabase
      .from('services')
      .select('id, name, slug')
      .eq('client_id', service.client_id)
      .eq('active', true);

    // Get cities for this client
    const { data: serviceCities } = await supabase
      .from('cities')
      .select('id, name, slug')
      .eq('client_id', service.client_id)
      .eq('active', true);

    // Generate content directly
    const { parsed, aiModel, tokenCount } = await generateContent(service, city, client, allServices || [], serviceCities || []);

    // Create draft with minimal fields
    const { data: draft, error: draftError } = await supabase
      .from('drafts')
      .insert({
        queue_id: queue_item_id,
        client_id: queueItem.client_id,
        status: 'draft',
        content_json: { generated: true },
        generation_model: aiModel,
        token_count: tokenCount,
      })
      .select()
      .single();

    if (draftError || !draft) {
      console.error('Draft create error:', draftError);
      return NextResponse.json({ error: 'Failed to create draft', details: draftError?.message }, { status: 500 });
    }

    console.log('Draft created:', draft.id);

    // Insert content
    await supabase.from('draft_content').insert({
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

    await supabase.from('page_queue').update({ status: 'draft_ready' }).eq('id', queue_item_id);

    return NextResponse.json({
      success: true,
      draft_id: draft.id,
    });
  } catch (error) {
    console.error('Queue item generation error:', error);
    return NextResponse.json({ error: 'Failed to generate content: ' + String(error) }, { status: 500 });
  }
}