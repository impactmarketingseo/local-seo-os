'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface Draft {
  id: string;
  title: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  status: string;
  version_number: number;
  created_at: string;
  client_id: string;
  service_id?: string;
  city_id?: string;
  clients: { name: string } | null;
  services?: { name: string; slug: string } | null;
  cities?: { name: string; state: string; slug: string } | null;
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
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadDrafts() {
      const supabase = createSupabaseBrowserClient();
      let query = supabase
        .from('drafts')
        .select('*, clients(name), services(name, slug), cities(name, state, slug)')
        .order('created_at', { ascending: false });
      if (filter !== 'all') query = query.eq('status', filter);
      if (clientFilter) query = query.eq('client_id', clientFilter);
      const { data } = await query;
      if (data) {
        let filtered = data as any;
        if (search) {
          const s = search.toLowerCase();
          filtered = data.filter((d: any) => 
            d.content_json?.meta?.title?.toLowerCase().includes(s) || 
            d.clients?.name?.toLowerCase().includes(s)
          );
        }
        setDrafts(filtered);
      }
      setLoading(false);
    }
    loadDrafts();
  }, [filter, clientFilter]);

  useEffect(() => {
    async function loadClients() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.from('clients').select('id, name').eq('status', 'active').order('name');
      if (data) setClients(data);
    }
    loadClients();
  }, []);

  async function updateStatus(id: string, status: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('drafts').update({ status }).eq('id', id);
    setDrafts(drafts.map(d => d.id === id ? { ...d, status } : d));
  }

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
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <input
          type="text"
          placeholder="Search drafts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1 min-w-48"
        />
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All clients</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
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
                    <h3 className="font-semibold text-text-primary truncate">
                      {draft.services?.name && draft.cities?.name 
                        ? `${draft.services.name} in ${draft.cities.name}, ${draft.cities.state}`
                        : draft.content_json?.meta?.title || draft.meta_title || 'Untitled Draft'}
                    </h3>
                    <p className="text-sm text-text-tertiary">
                      {draft.clients?.name}
                      {draft.content_json?.meta?.slug && (
                        <span className="text-text-disabled"> / {draft.content_json.meta.slug}</span>
                      )}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      const nextStatus = draft.status === 'draft' ? 'review' : draft.status === 'review' ? 'approved' : 'draft';
                      updateStatus(draft.id, nextStatus);
                    }}
                    onMouseEnter={(e) => e.currentTarget.classList.add('ring-2', 'ring-accent')}
                    onMouseLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-accent')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 ${status.bg} ${status.text} cursor-pointer transition-all`}
                    title="Click to change status"
                  >
                    {draft.status}
                  </button>
                </div>
                {draft.slug && (
                  <p className="text-xs text-text-disabled mb-2">/{draft.slug}</p>
                )}
                <div className="flex gap-4 text-xs text-text-disabled mono">
                  <span>/{draft.slug}</span>
                  <span>v{draft.version_number}</span>
                  <span>{wordCount(draft)} words</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function wordCount(draft: any) {
  const text = draft.content_text || draft.content_json?.content_text || '';
  return text.split(/\s+/).filter(Boolean).length;
}
