import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { queue_item_id } = await req.json();

    if (!queue_item_id) {
      return NextResponse.json({ error: 'Missing queue_item_id' }, { status: 400 });
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

    if (queueError || !queueItem) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
    }

    const { data: keywordTarget } = await supabase
      .from('keyword_targets')
      .select('*')
      .eq('service_id', queueItem.service_id)
      .eq('city_id', queueItem.city_id)
      .maybeSingle();

    const client = queueItem.clients as any;
    const service = queueItem.services as any;
    const city = queueItem.cities as any;

    console.log('Queue item:', { service_id: queueItem.service_id, city_id: queueItem.city_id, service, city, client });

    const generateUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://local-seo-os.vercel.app';

    const generateResponse = await fetch(`${generateUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
        years_in_business: client?.years_in_business || '',
      }),
    });

    console.log('Sending to generate:', {
      phone: client?.phone,
      email: client?.email,
      address: client?.address,
      website_url: client?.website_url,
      years_in_business: client?.years_in_business,
    });

    const result = await generateResponse.json();

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