'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { cn, formatDateTime } from '@/lib/utils';

interface Draft {
  id: string;
  title: string;
  status: string;
  version_number: number;
  created_at: string;
  client_id: string;
  clients: { name: string } | null;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  published: 'bg-green-200 text-green-900',
};

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function loadDrafts() {
      const supabase = createSupabaseBrowserClient();
      
      let query = supabase.from('drafts').select(`
        *,
        clients(name)
      `).order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      if (data) setDrafts(data as any);
      setLoading(false);
    }

    loadDrafts();
  }, [filter]);

  async function updateStatus(id: string, status: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('drafts').update({ status }).eq('id', id);
    setDrafts(drafts.map(d => d.id === id ? { ...d, status } : d));
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drafts</h1>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {['all', 'draft', 'review', 'approved', 'published'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm capitalize',
              filter === status ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {drafts.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No drafts yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Generate drafts from the queue to see them here
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map(draft => (
            <div key={draft.id} className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-medium">{draft.title || 'Untitled Draft'}</h3>
                <span className={cn('rounded-full px-2 py-1 text-xs capitalize',
                  statusColors[draft.status] || 'bg-gray-100'
                )}>
                  {draft.status}
                </span>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                {draft.clients?.name || 'Unknown client'}
              </p>
              <div className="mb-3 text-xs text-muted-foreground">
                v{draft.version_number} · {formatDateTime(draft.created_at)}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/drafts/${draft.id}`}
                  className="rounded-lg border bg-background px-3 py-1.5 text-sm hover:bg-accent"
                >
                  View
                </Link>
                {(draft.status === 'draft' || draft.status === 'review') && (
                  <button
                    onClick={() => updateStatus(draft.id, 'approved')}
                    className="rounded-lg bg-green-100 px-3 py-1.5 text-sm text-green-800 hover:bg-green-200"
                  >
                    Approve
                  </button>
                )}
                {(draft.status === 'draft' || draft.status === 'review') && (
                  <button
                    onClick={() => updateStatus(draft.id, 'rejected')}
                    className="rounded-lg bg-red-100 px-3 py-1.5 text-sm text-red-800 hover:bg-red-200"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}