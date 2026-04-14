import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WordPressCredentials {
  base_url: string;
  username: string;
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    const { draft_id, client_id } = await req.json();

    if (!draft_id || !client_id) {
      return NextResponse.json({ error: 'Missing draft_id or client_id' }, { status: 400 });
    }

    const { data: wpConnection } = await supabase
      .from('wordpress_connections')
      .select('*')
      .eq('client_id', client_id)
      .eq('enabled', true)
      .single();

    if (!wpConnection) {
      return NextResponse.json({ error: 'No WordPress connection configured for this client' }, { status: 400 });
    }

    const { data: draft } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', draft_id)
      .single();

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const wpCredentials = {
      base_url: wpConnection.base_url,
      username: wpConnection.username,
      password: Buffer.from(wpConnection.encrypted_password, 'base64').toString('utf-8'),
    };

    const wpResponse = await createWordPressDraft(wpCredentials, draft);

    await supabase.from('publishing_logs').insert({
      draft_id,
      client_id,
      action_type: 'create_draft',
      destination: wpCredentials.base_url,
      wp_post_id: wpResponse.post?.id,
      wp_post_url: wpResponse.post?._links?.self?.[0]?.href,
      success: wpResponse.ok,
      response_summary: wpResponse.data,
    });

    if (wpResponse.ok) {
      await supabase.from('drafts').update({ status: 'sent_to_wp' }).eq('id', draft_id);
    }

    return NextResponse.json(wpResponse);
  } catch (error) {
    console.error('WordPress draft creation error:', error);
    return NextResponse.json({ error: 'Failed to create WordPress draft' }, { status: 500 });
  }
}

async function createWordPressDraft(credentials: WordPressCredentials, draft: any): Promise<any> {
  const { base_url, username, password } = credentials;
  
  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  const contentHtml = draft.content_text || `
    <h1>${draft.h1}</h1>
    <p>${draft.intro}</p>
    ${(draft.sections || []).map((s: any) => `<h2>${s.heading}</h2><p>${s.content}</p>`).join('')}
    <h2>Frequently Asked Questions</h2>
    ${(draft.faqs || []).map((f: any) => `<h3>${f.question}</h3><p>${f.answer}</p>`).join('')}
    <h2>Contact Us</h2>
    <p>${draft.cta_block}</p>
  `;

  try {
    const response = await fetch(`${base_url}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: draft.title,
        slug: draft.slug,
        status: 'draft',
        meta: {
          _yoast_wpseo_title: draft.meta_title,
          _yoast_wpseo_metadesc: draft.meta_description,
        },
        content: contentHtml,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, post: data, data };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}