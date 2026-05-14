import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const DEFAULT_SETTINGS = {
  branding: { 
    logo_url: null, 
    app_name: 'SEO OS', 
    accent_color: '#3B82F6',
    accent_color_2: '#2563EB',
    use_gradient: false
  },
  general: { timezone: 'America/New_York' }
};

type SettingsKey = keyof typeof DEFAULT_SETTINGS;

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

  // Always return all settings, merging defaults with DB values
  const mergedSettings: typeof DEFAULT_SETTINGS = { ...DEFAULT_SETTINGS };
  data?.forEach((item) => {
    if (item.key && item.value && item.key in DEFAULT_SETTINGS) {
      (mergedSettings as Record<string, unknown>)[item.key as string] = { 
        ...(mergedSettings as Record<string, unknown>)[item.key as string] as Record<string, unknown>, 
        ...item.value 
      };
    }
  });

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

  if (!key || !value) {
    return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('app_settings')
    .select('id')
    .eq('key', key)
    .single();

  if (existing) {
    await supabase
      .from('app_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);
  } else {
    await supabase
      .from('app_settings')
      .insert({ key, value });
  }

  return NextResponse.json({ success: true });
}
