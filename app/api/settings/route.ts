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

  // If table doesn't exist or error, return defaults
  if (error || !data || data.length === 0) {
    return NextResponse.json(DEFAULT_SETTINGS);
  }

  const settings: Record<string, any> = {};
  data?.forEach((item) => {
    settings[item.key] = item.value;
  });

  return NextResponse.json(settings);
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

  if (!key || !value) {
    return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
  }

  // First check if record exists
  const { data: existing } = await supabase
    .from('app_settings')
    .select('id')
    .eq('key', key)
    .single();

  if (existing) {
    // Update existing
    await supabase
      .from('app_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);
  } else {
    // Insert new
    await supabase
      .from('app_settings')
      .insert({ key, value });
  }

  return NextResponse.json({ success: true });
}
