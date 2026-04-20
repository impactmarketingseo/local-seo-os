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
      return NextResponse.json({ error: 'Queue item not found', details: queueError?.message }, { status: 404 });
    }

    console.log('Queue item:', { service_id: queueItem.service_id, city_id: queueItem.city_id });

    const generateUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const generateResponse = await fetch(`${generateUrl}/api/generate/v2`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queue_item_id,
        service_id: queueItem.service_id,
        city_id: queueItem.city_id,
      }),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('Generate API error:', generateResponse.status, errorText);
      return NextResponse.json({ error: 'Generate failed', details: errorText.substring(0, 500) }, { status: 500 });
    }

    const result = await generateResponse.json();
    
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Generation failed' }, { status: 500 });
    }

    await supabase.from('page_queue').update({ status: 'draft_ready' }).eq('id', queue_item_id);

    return NextResponse.json({ success: true, draft_id: result.draft_id });
  } catch (error) {
    console.error('Queue item generation error:', error);
    return NextResponse.json({ error: 'Failed: ' + String(error) }, { status: 500 });
  }
}