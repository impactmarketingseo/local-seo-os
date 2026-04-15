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

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-warning/10', text: 'text-warning' },
  review: { bg: 'bg-info/10', text: 'text-info' },
  approved: { bg: 'bg-success/10', text: 'text-success' },
  rejected: { bg: 'bg-error/10', text: 'text-error' },
};

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

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="skeleton h-8 w-24 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="page-title">Drafts</h1>
        <p className="text-text-tertiary mt-1">Review and approve AI-generated content</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'draft', 'review', 'approved', 'rejected'].map((status) => (
          <button key={status} onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize whitespace-nowrap transition-colors ${
              filter === status ? 'bg-accent text-white' : 'bg-input text-text-tertiary hover:text-text-secondary'
            }`}>
            {status}
          </button>
        ))}
      </div>

      {/* Draft List */}
      {drafts.length === 0 ? (
        <div className="card-standard text-center">
          <div className="flex h-14 w-14 mx-auto mb-4 items-center justify-center rounded-full bg-input">
            <svg className="w-7 h-7 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-text-primary">No drafts found</h3>
          <p className="text-sm text-text-tertiary mt-1">Generate content from the queue to see drafts here</p>
          <Link href="/queue" className="btn-primary mt-4 inline-block">
            Go to Queue
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft, index) => {
            const status = statusColors[draft.status] || statusColors.draft;
            return (
              <Link 
                key={draft.id} 
                href={`/drafts/${draft.id}`} 
                className="block card-standard hover:border-accent/40 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <h3 className="font-semibold text-text-primary truncate">{draft.meta_title || draft.title || 'Untitled'}</h3>
                    <p className="text-sm text-text-tertiary">{draft.clients?.name}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 ${status.bg} ${status.text}`}>
                    {draft.status}
                  </span>
                </div>
                {draft.slug && (
                  <p className="text-xs text-text-disabled mb-2">/{draft.slug}</p>
                )}
                <div className="flex gap-4 text-xs text-text-disabled mono">
                  <span>/{draft.slug}</span>
                  <span>v{draft.version_number}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
