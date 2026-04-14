import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SERVICE_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: queueItems } = await supabase
      .from('page_queue')
      .select(`
        id,
        client_id,
        services(name),
        cities(name, state),
        clients(niche, voice_notes, cta_preference, banned_phrases)
      `)
      .eq('status', 'approved')
      .eq('generation_mode', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .limit(1)
      .order('scheduled_for', { ascending: true });

    if (!queueItems || queueItems.length === 0) {
      return NextResponse.json({ message: 'No items to generate' });
    }

    const results = [];
    
    for (const queueItem of queueItems) {
      const client = (queueItem as any).clients as any;
      const service = (queueItem as any).services as any;
      const city = (queueItem as any).cities as any;

      try {
        const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queue_item_id: queueItem.id,
            client_id: queueItem.client_id,
            service_id: queueItem.service_id,
            city_id: queueItem.city_id,
            primary_keyword: `${service?.name} in ${city?.name}, ${city?.state}`,
            niche: client?.niche,
            brand_voice: client?.voice_notes,
            cta_preference: client?.cta_preference,
            banned_phrases: client?.banned_phrases,
          }),
        });

        const result = await generateResponse.json();
        results.push({ queue_id: queueItem.id, ...result });
      } catch (error) {
        results.push({ queue_id: queueItem.id, error: String(error) });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Weekly generation error:', error);
    return NextResponse.json({ error: 'Weekly generation failed' }, { status: 500 });
  }
}