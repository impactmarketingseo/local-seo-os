import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const generateUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    console.log('Generate URL:', generateUrl);

    const generateResponse = await fetch(`${generateUrl}/api/generate/v2`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-internal-request': 'true'
      },
      body: JSON.stringify({
        queue_item_id,
        service_id: queueItem.service_id,
        city_id: queueItem.city_id,
        model: model || 'groq',
      }),
    });

    console.log('Sending to generate:', {
      phone: client?.phone,
      email: client?.email,
      address: client?.address,
      website_url: client?.website_url,
      years_in_business: client?.years_in_business,
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('Generate API error:', generateResponse.status, errorText);
      return NextResponse.json({ 
        error: 'Generate API failed', 
        status: generateResponse.status,
        details: errorText.substring(0, 1000)
      }, { status: 500 });
    }

    const resultText = await generateResponse.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      console.error('Non-JSON response from generate API:', resultText.substring(0, 500));
      return NextResponse.json({ 
        error: 'Generation failed', 
        details: 'Invalid response from server. Are you logged in?',
        debug: resultText.substring(0, 200)
      }, { status: 500 });
    }

    if (!result.success) {
      return NextResponse.json({ error: 'Generation failed', details: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      draft_id: result.draft_id,
    });
  } catch (error) {
    console.error('Queue item generation error:', error);
    return NextResponse.json({ error: 'Failed to generate content: ' + String(error) }, { status: 500 });
  }
}