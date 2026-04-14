import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { queue_item_id } = await req.json();

    console.log('queue_item_id:', queue_item_id);

    if (!queue_item_id) {
      return NextResponse.json({ error: 'Missing queue_item_id' }, { status: 400 });
    }

    const { data: queueItem, error: queueError } = await supabase
      .from('page_queue')
      .select(`
        *,
        services(name),
        cities(name, state),
        clients(niche, voice_notes, cta_preference, banned_phrases)
      `)
      .eq('id', queue_item_id)
      .single();

    if (queueError || !queueItem) {
      console.log('Queue error:', queueError);
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

    const generateUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://local-seo-os.vercel.app';
    
    console.log('Calling generate API...');

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
      }),
    });

    const result = await generateResponse.json();
    console.log('Generate result:', result);

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