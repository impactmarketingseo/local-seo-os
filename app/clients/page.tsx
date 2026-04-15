'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface Client {
  id: string;
  name: string;
  niche: string;
  website_url?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  status: string;
  created_at: string;
  _count?: { queue_items: number; drafts: number };
}

const statusColors: Record<string, { bg: string; dot: string; label: string }> = {
  active: { bg: 'bg-success/10 text-success', dot: 'bg-success', label: 'Active' },
  paused: { bg: 'bg-warning/10 text-warning', dot: 'bg-warning', label: 'Paused' },
  archived: { bg: 'bg-input text-text-tertiary', dot: 'bg-text-disabled', label: 'Completed' },
};

const nicheColors: Record<string, string> = {
  'pest': 'bg-purple-500/10 text-purple-400',
  'plumbing': 'bg-blue-500/10 text-blue-400',
  'roofing': 'bg-orange-500/10 text-orange-400',
  'hvac': 'bg-cyan-500/10 text-cyan-400',
  'heating': 'bg-cyan-500/10 text-cyan-400',
  'cooling': 'bg-cyan-500/10 text-cyan-400',
  'electrical': 'bg-yellow-500/10 text-yellow-400',
  'landscaping': 'bg-green-500/10 text-green-400',
  'cleaning': 'bg-pink-500/10 text-pink-400',
  'default': 'bg-accent/10 text-accent',
};

function getNicheColor(niche: string): string {
  const key = niche?.toLowerCase().split(' ')[0] || 'default';
  return nicheColors[key] || nicheColors.default;
}

function ClientCard({ client, delay }: { client: Client; delay?: number }) {
  const status = statusColors[client.status] || statusColors.paused;
  const nicheColor = getNicheColor(client.niche);
  
  return (
    <Link 
      href={`/clients/${client.id}`}
      className="group card-standard animate-scale-in" 
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary truncate">{client.name}</h3>
            <span className={status.label !== 'Active' ? 'opacity-50' : ''}>
              <span className={`w-2 h-2 rounded-full ${status.dot} inline-block`} />
            </span>
          </div>
          <span className={`inline-block mt-1 rounded-md px-2.5 py-0.5 text-xs font-medium ${nicheColor}`}>
            {client.niche}
          </span>
        </div>
        <button className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-text-secondary hover:bg-input transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="mt-4 space-y-3">
        {client.website_url && (
          <p className="text-xs mono text-text-tertiary truncate">{client.website_url}</p>
        )}
        
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          {client.city && client.state && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {client.city}, {client.state}
            </span>
          )}
        </div>

        {client.phone && (
          <p className="text-sm text-text-tertiary">{client.phone}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 pt-2 text-xs text-text-disabled">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {client._count?.queue_items || 0} in queue
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {client._count?.drafts || 0} drafts
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
        <Link href={`/clients/${client.id}`} className="flex-1 btn-primary text-sm text-center">
          Open Workspace
        </Link>
      </div>
    </Link>
  );
}

function ClientCardSkeleton() {
  return (
    <div className="card-standard">
      <div className="flex items-start justify-between">
        <div>
          <div className="skeleton h-5 w-32 mb-2" />
          <div className="skeleton h-5 w-20" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="skeleton h-10 w-full" />
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'archived'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadClients() {
      const supabase = createSupabaseBrowserClient();
      
      let query = supabase.from('clients').select(`
        *,
        queue_items:page_queue(count),
        drafts:drafts(count)
      `).order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query;
      
      if (data) {
        const clientsWithCounts = data.map((c: any) => ({
          ...c,
          _count: {
            queue_items: c.queue_items?.[0]?.count || 0,
            drafts: c.drafts?.[0]?.count || 0,
          }
        }));
        setClients(clientsWithCounts);
      }
      setLoading(false);
    }

    loadClients();
  }, [filter]);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.niche?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="text-text-tertiary mt-1">Manage your client portfolio</p>
        </div>
        <Link href="/clients/new" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search clients by name or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'paused', 'archived'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-accent text-white'
                  : 'bg-input text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <ClientCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="rounded-xl border border-border p-10 text-center">
          <div className="flex h-14 w-14 mx-auto mb-4 items-center justify-center rounded-full bg-input">
            <svg className="w-7 h-7 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="font-semibold text-text-primary">No clients found</h3>
          <p className="text-sm text-text-tertiary mt-1">Add your first client to get started</p>
          <Link href="/clients/new" className="btn-primary mt-4">
            Add Your First Client
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client, index) => (
            <ClientCard key={client.id} client={client} delay={(index + 1) * 50} />
          ))}
        </div>
      )}
    </div>
  );
}