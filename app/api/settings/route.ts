import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const DEFAULT_SETTINGS = {
  branding: { logo_url: null, app_name: 'SEO OS', accent_color: '#3B82F6' },
  general: { timezone: 'America/New_York' }
};

export async function GET() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data, error } = await supabase.from('app_settings').select('key, value');

  console.log('[API /settings GET] Data:', data, 'Error:', error);

  // Always return all settings, merging defaults with DB values
  const mergedSettings = { ...DEFAULT_SETTINGS };
  data?.forEach((item) => {
    if (item.key && item.value) {
      mergedSettings[item.key] = { ...mergedSettings[item.key], ...item.value };
    }
  });

  console.log('[API /settings GET] Merged settings:', mergedSettings);
  return NextResponse.json(mergedSettings);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const body = await request.json();
  const { key, value } = body;

  console.log('[API /settings POST] Saving:', key, value);

  if (!key || !value) {
    return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
  }

  // First check if record exists
  const { data: existing } = await supabase
    .from('app_settings')
    .select('id')
    .eq('key', key)
    .single();

  console.log('[API /settings POST] Existing record:', existing);

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('app_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);
    console.log('[API /settings POST] Update error:', error);
  } else {
    // Insert new
    const { error } = await supabase
      .from('app_settings')
      .insert({ key, value });
    console.log('[API /settings POST] Insert error:', error);
  }

  return NextResponse.json({ success: true });
}
