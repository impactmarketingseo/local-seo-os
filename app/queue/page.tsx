'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface QueueItem {
  id: string;
  client_id: string;
  service_id: string | null;
  city_id: string | null;
  status: string;
  scheduled_for: string | null;
  priority: number;
  generation_mode: string;
  notes: string | null;
  synonym: string | null;
  created_at: string;
  clients: { name: string; niche: string } | null;
  services: { name: string } | null;
  cities: { name: string; state: string } | null;
  error_message?: string;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  planned: { bg: 'bg-input', text: 'text-text-tertiary', label: 'Planned' },
  approved_for_gen: { bg: 'bg-info/10', text: 'text-info', label: 'Ready' },
  generating: { bg: 'bg-info/10', text: 'text-info', label: 'Running' },
  draft_ready: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Draft Ready' },
  needs_review: { bg: 'bg-warning/10', text: 'text-warning', label: 'Review' },
  approved: { bg: 'bg-success/10', text: 'text-success', label: 'Approved' },
  exported: { bg: 'bg-success/10', text: 'text-success', label: 'Exported' },
  sent_to_wp: { bg: 'bg-accent/10', text: 'text-accent', label: 'Sent to WP' },
  published: { bg: 'bg-success/10', text: 'text-success', label: 'Published' },
  archived: { bg: 'bg-input', text: 'text-text-disabled', label: 'Archived' },
  failed: { bg: 'bg-error/10', text: 'text-error', label: 'Failed' },
};

const statusTabs = ['all', 'planned', 'generating', 'completed', 'failed'] as const;

function QueueRow({ item, onUpdate, onDelete, onGenerate, delay }: { item: QueueItem; onUpdate: (id: string, status: string) => void; onDelete: (id: string) => void; onGenerate: (id: string) => void; delay?: number }) {
  const status = statusColors[item.status] || statusColors.planned;
  const [showError, setShowError] = useState(false);

  return (
    <div 
      className="group rounded-lg bg-card/50 border border-border hover:border-accent/30 transition-all animate-fade-in"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        {/* Client & Target */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary truncate">{item.clients?.name || 'Unknown Client'}</p>
          <p className="text-sm text-text-tertiary truncate">
            {item.services?.name ? (
              <span className="mono">{item.services.name}</span>
            ) : item.service_id ? (
              <span className="mono text-warning">Service ID: {item.service_id}</span>
            ) : (
              <span className="mono text-error">No service selected</span>
            )}
            {item.cities?.name ? ` in ${item.cities.name}, ${item.cities.state}` : item.city_id ? ` (City ID: ${item.city_id})` : ' - No city'}
          </p>
          {item.notes && <p className="text-xs text-accent mt-1">Keyword: {item.notes}</p>}
        </div>

        {/* Status - visible on all screens */}
        <div className="order-2 sm:order-none">
          <button
            onClick={() => item.status === 'failed' && setShowError(!showError)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text} ${item.status === 'failed' ? 'cursor-pointer hover:opacity-80' : ''}`}
          >
            {item.status === 'generating' && (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {status.label}
          </button>
        </div>

        {/* Actions - stack below on mobile */}
        <div className="flex gap-2 order-1 sm:order-none sm:ml-auto">
          {item.status === 'planned' && (
            <button
              onClick={() => onGenerate(item.id)}
              className="btn-primary text-xs py-1.5 px-3"
            >
              Generate
            </button>
          )}
          {item.status === 'needs_review' && (
            <Link
              href={`/drafts`}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Review
            </Link>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="text-xs text-error hover:underline py-1.5"
          >
            Delete
          </button>
        </div>
      </div>

        {/* Scheduled */}
        <div className="hidden lg:block w-24 text-sm text-text-tertiary mono">
          {item.scheduled_for ? new Date(item.scheduled_for).toLocaleDateString() : '—'}
        </div>

      </div>

      {/* Error Detail */}
      {showError && item.error_message && (
        <div className="px-4 pb-4 pt-0">
          <div className="rounded-md bg-error/10 p-3 text-sm text-error">
            <p className="font-medium">Error:</p>
            <p className="mono">{item.error_message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TableHeader() {
  return (
    <div className="hidden rounded-lg bg-sidebar border border-border p-3 text-xs font-medium uppercase tracking-wider text-text-disabled sm:grid grid-cols-[1fr_8rem_7rem_6rem_1fr] gap-4">
      <div>Client / Target</div>
      <div className="md:text-center">Type</div>
      <div className="text-center">Status</div>
      <div className="hidden lg:block text-right">Scheduled</div>
      <div className="text-right">Actions</div>
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="space-y-3">
      <TableHeader />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton h-16 rounded-lg" />
      ))}
    </div>
  );
}

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof statusTabs[number]>('all');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  const loadQueue = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    
    let query = supabase.from('page_queue').select(`
      *,
      clients(name, niche),
      services(name),
      cities(name, state)
    `, { count: 'exact' }).order('created_at', { ascending: false });

    if (filter === 'planned') {
      query = query.eq('status', 'planned');
    } else if (filter === 'generating') {
      query = query.in('status', ['generating', 'approved_for_gen']);
    } else if (filter === 'completed') {
      query = query.in('status', ['approved', 'exported', 'sent_to_wp', 'published']);
    } else if (filter === 'failed') {
      query = query.eq('status', 'failed');
    }

    if (clientFilter) {
      query = query.eq('client_id', clientFilter);
    }

    const { data } = await query;
    if (data) setItems(data as any);

    const { data: clientsData } = await supabase.from('clients').select('id, name').eq('status', 'active').order('name');
    if (clientsData) setClients(clientsData);
    setLoading(false);
  }, [filter, clientFilter]);

  useEffect(() => {
    loadQueue();
    
    const interval = setInterval(loadQueue, 15000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  async function updateStatus(id: string, status: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('page_queue').update({ status }).eq('id', id);
    loadQueue();
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this queue item?')) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.from('page_queue').delete().eq('id', id);
    loadQueue();
  }

  async function generateContent(id: string) {
    if (!confirm('Generate content for this item? This uses your free Groq API.')) return;
    
    try {
      setItems(items.map(i => i.id === id ? { ...i, status: 'generating' } : i));
      
      const response = await fetch('/api/generate/queue-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_item_id: id }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Content generated! Check Drafts.');
      } else {
        alert('Error: ' + result.error);
      }
      loadQueue();
    } catch (e) {
      alert('Failed to generate: ' + e);
      loadQueue();
    }
  }

  const counts = {
    all: items.length,
    planned: items.filter(i => i.status === 'planned').length,
    generating: items.filter(i => ['generating', 'approved_for_gen'].includes(i.status)).length,
    completed: items.filter(i => ['approved', 'exported', 'sent_to_wp', 'published'].includes(i.status)).length,
    failed: items.filter(i => i.status === 'failed').length,
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Content Queue</h1>
          <p className="text-text-tertiary mt-1">Pipeline monitor — {items.length} items</p>
        </div>
        <Link href="/queue/new" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Run New Batch
        </Link>
      </div>

      {/* Client Filter */}
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm text-text-tertiary">Filter by client:</label>
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Clients</option>
          {clients.length > 0 ? clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          )) : <option disabled>No clients found</option>}
        </select>
        {clientFilter && (
          <button onClick={() => setClientFilter('')} className="text-sm text-text-tertiary hover:text-accent">
            Clear filter
          </button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors whitespace-nowrap ${
              filter === tab 
                ? 'bg-accent text-white' 
                : 'bg-input text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab}
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              filter === tab ? 'bg-white/20 text-white' : 'bg-border text-text-disabled'
            }`}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Queue Items */}
      {loading ? (
        <QueueSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border p-10 text-center">
          <div className="flex h-14 w-14 mx-auto mb-4 items-center justify-center rounded-full bg-input">
            <svg className="w-7 h-7 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <h3 className="font-semibold text-text-primary">No queue items</h3>
          <p className="text-sm text-text-tertiary mt-1">Add items to your content queue</p>
          <Link href="/queue/new" className="btn-primary mt-4">
            Add to Queue
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <TableHeader />
          {items.map((item, index) => (
            <QueueRow
              key={item.id}
              item={item}
              onUpdate={updateStatus}
              onDelete={deleteItem}
              onGenerate={generateContent}
              delay={(index + 1) * 30}
            />
          ))}
        </div>
      )}
    </div>
  );
}