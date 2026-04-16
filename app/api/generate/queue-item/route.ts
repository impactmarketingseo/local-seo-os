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
        services(name),
        cities(name, state),
        clients(id, name, niche, voice_notes, cta_preference, banned_phrases, phone, email, address, website_url, years_in_business)
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

    const { data: keywordTarget } = await supabase
      .from('keyword_targets')
      .select('*')
      .eq('service_id', queueItem.service_id)
      .eq('city_id', queueItem.city_id)
      .maybeSingle();

    // If service_id or city_id is null, log it
    if (!queueItem.service_id || !queueItem.city_id) {
      console.warn('Missing service_id or city_id:', { 
        service_id: queueItem.service_id, 
        city_id: queueItem.city_id 
      });
    }

    const client = queueItem.clients as any;
    const service = queueItem.services as any;
    const city = queueItem.cities as any;

    console.log('Queue item:', { service_id: queueItem.service_id, city_id: queueItem.city_id, service, city, client });

    const generateUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    console.log('Generate URL:', generateUrl);

    const generateResponse = await fetch(`${generateUrl}/api/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-internal-request': 'true'
      },
      body: JSON.stringify({
        queue_item_id,
        client_id: queueItem.client_id,
        service_id: queueItem.service_id,
        city_id: queueItem.city_id,
        primary_keyword: keywordTarget?.primary_keyword || `${service?.name} in ${city?.name}, ${city?.state}`,
        synonym: keywordTarget?.synonym,
        niche: client?.niche,
        brand_voice: client?.voice_notes,
        cta_preference: client?.cta_preference,
        banned_phrases: client?.banned_phrases,
        client_name: client?.name,
        city: city?.name,
        state: city?.state,
        phone: client?.phone || 'NO_PHONE_SET',
        email: client?.email || 'NO_EMAIL_SET',
        address: client?.address || 'NO_ADDRESS_SET',
        website_url: client?.website_url || 'NO_WEBSITE_SET',
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