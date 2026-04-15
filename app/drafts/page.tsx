'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface Draft {
  id: string;
  title: string;
  slug: string;
  meta_description: string;
  status: string;
  version_number: number;
  created_at: string;
  client_id: string;
  clients: { name: string } | null;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function loadDrafts() {
      const supabase = createSupabaseBrowserClient();
      let query = supabase.from('drafts').select('*, clients(name)').order('created_at', { ascending: false });
      if (filter !== 'all') query = query.eq('status', filter);
      const { data } = await query;
      if (data) setDrafts(data as any);
      setLoading(false);
    }
    loadDrafts();
  }, [filter]);

  if (loading) return <div className="p-4 text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b p-4">
        <h1 className="text-xl font-bold">Drafts</h1>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-4 py-2 flex gap-2 overflow-x-auto">
        {['all', 'draft', 'review', 'approved', 'rejected'].map((status) => (
          <button key={status} onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filter === status ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
            {status}
          </button>
        ))}
      </div>

      {/* Draft List */}
      <div className="p-4 space-y-3">
        {drafts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No drafts found</div>
        ) : (
          drafts.map((draft) => (
            <Link key={draft.id} href={`/drafts/${draft.id}`} className="block bg-white rounded-lg border p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="font-semibold text-sm truncate">{draft.title}</h3>
                  <p className="text-xs text-gray-500">{draft.clients?.name}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${draft.status === 'approved' ? 'bg-green-100 text-green-700' : draft.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {draft.status}
                </span>
              </div>
              {draft.meta_description && (
                <p className="text-xs text-gray-600 line-clamp-2">{draft.meta_description}</p>
              )}
              <div className="mt-2 flex gap-4 text-xs text-gray-400">
                <span>/{draft.slug}</span>
                <span>v{draft.version_number}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}