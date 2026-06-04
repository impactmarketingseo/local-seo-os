import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json({ error: 'Missing client id' }, { status: 400 });
    }

    const { data: client, error: clientLookupError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .single();

    if (clientLookupError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { error: draftsError } = await supabase
      .from('drafts')
      .delete()
      .eq('client_id', clientId);

    if (draftsError) {
      return NextResponse.json(
        { error: 'Failed to delete drafts', details: draftsError.message },
        { status: 500 }
      );
    }

    const { error: clientDeleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (clientDeleteError) {
      return NextResponse.json(
        { error: 'Failed to delete client', details: clientDeleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted: client.name });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
