'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { toast } from '@/components/Toast';

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

function QueueRow({ item, onUpdate, onDelete, onGenerate, delay, selectable, selected, onSelect }: { item: QueueItem; onUpdate: (id: string, status: string) => void; onDelete: (id: string) => void; onGenerate: (id: string) => void; delay?: number; selectable?: boolean; selected?: boolean; onSelect?: (id: string, checked: boolean) => void }) {
  const status = statusColors[item.status] || statusColors.planned;
  const [showError, setShowError] = useState(false);

  return (
    <div 
      className="group rounded-lg bg-card/50 border border-border hover:border-accent/30 transition-all animate-fade-in"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        {/* Checkbox for bulk select */}
        {selectable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect?.(item.id, e.target.checked)}
            className="w-4 h-4 rounded border-border bg-input text-accent focus:ring-accent"
          />
        )}

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
  const [allServices, setAllServices] = useState<{ id: string; client_id: string; name: string }[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [model, setModel] = useState<'groq' | 'gemini'>('groq');

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

    if (serviceFilter) {
      query = query.eq('service_id', serviceFilter);
    }

    const { data } = await query;
    if (data) setItems(data as any);

    const { data: clientsData } = await supabase.from('clients').select('id, name').eq('status', 'active').order('name');
    if (clientsData) setClients(clientsData);

    const { data: allServicesData } = await supabase.from('services').select('id, client_id, name').eq('status', 'active').order('name');
    if (allServicesData) {
      setAllServices(allServicesData);
      if (clientFilter) {
        setServices(allServicesData.filter((s: any) => s.client_id === clientFilter));
      } else {
        setServices(allServicesData);
      }
    }
    
    // Reset service filter if current service doesn't belong to selected client
    if (serviceFilter && clientFilter) {
      const hasService = allServicesData?.some((s: any) => s.id === serviceFilter && s.client_id === clientFilter);
      if (!hasService) setServiceFilter('');
    }
    
    setLoading(false);
  }, [filter, clientFilter, serviceFilter]);

  useEffect(() => {
    loadQueue();
    
    const interval = setInterval(loadQueue, 15000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  // Update services when clientFilter changes
  useEffect(() => {
    if (clientFilter) {
      setServices(allServices.filter((s: any) => s.client_id === clientFilter));
      if (serviceFilter) {
        const hasService = allServices.some((s: any) => s.id === serviceFilter && s.client_id === clientFilter);
        if (!hasService) setServiceFilter('');
      }
    } else {
      setServices(allServices);
    }
  }, [clientFilter]);

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
    try {
      setItems(items.map(i => i.id === id ? { ...i, status: 'generating' } : i));
      
      const response = await fetch('/api/generate/queue-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_item_id: id, model }),
      });
      
      if (!response.ok) {
        const text = await response.text();
        toast('Error ' + response.status + ': ' + text.substring(0, 200), 'error');
        loadQueue();
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast('Content generated! Check Drafts.', 'success');
      } else {
        toast(result.error + (result.details ? ' - ' + result.details : ''), 'error');
      }
      loadQueue();
    } catch (e) {
      toast('Failed to generate: ' + e, 'error');
      loadQueue();
    }
  }

  async function bulkGenerate() {
    const ids = Array.from(selectedItems);
    if (ids.length === 0) return;
    
    setBulkGenerating(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const id of ids) {
      try {
        setItems(items.map(i => i.id === id ? { ...i, status: 'generating' } : i));
        
        const response = await fetch('/api/generate/queue-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queue_item_id: id, model }),
        });
        
        const result = await response.json();
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        failCount++;
      }
    }
    
    setBulkGenerating(false);
    setSelectedItems(new Set());
    loadQueue();
    
    if (successCount > 0) {
      toast(`Generated ${successCount} draft${successCount > 1 ? 's' : ''}!`, 'success');
    }
    if (failCount > 0) {
      toast(`${failCount} failed`, 'error');
    }
  }

  function toggleSelectAll(checked: boolean) {
    const plannedItems = items.filter(i => i.status === 'planned').map(i => i.id);
    if (checked) {
      setSelectedItems(new Set([...selectedItems, ...plannedItems]));
    } else {
      const newSelected = new Set(selectedItems);
      plannedItems.forEach(id => newSelected.delete(id));
      setSelectedItems(newSelected);
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

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-tertiary">Client:</label>
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-tertiary">Service:</label>
          <select
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {(clientFilter || serviceFilter) && (
          <button 
            onClick={() => { setClientFilter(''); setServiceFilter(''); }} 
            className="text-sm text-text-tertiary hover:text-accent"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {counts.planned > 0 && (
        <div className="mb-4 p-3 bg-elevated rounded-lg border border-border flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={items.filter(i => i.status === 'planned').every(i => selectedItems.has(i.id))}
              onChange={(e) => toggleSelectAll(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-input text-accent focus:ring-accent"
            />
            <span className="text-sm text-text-secondary">Select all planned ({counts.planned})</span>
          </label>
          
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as 'groq' | 'gemini')}
            className="input-field text-sm"
          >
            <option value="groq">Groq (Fast)</option>
            <option value="gemini">Gemini (Backup)</option>
          </select>
          
          {selectedItems.size > 0 && (
            <button
              onClick={bulkGenerate}
              disabled={bulkGenerating}
              className="btn-primary text-sm py-1.5"
            >
              {bulkGenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin mr-2 inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Selected ({selectedItems.size})
                </>
              )}
            </button>
          )}
        </div>
      )}

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
              selectable={item.status === 'planned'}
              selected={selectedItems.has(item.id)}
              onSelect={(id, checked) => {
                const newSelected = new Set(selectedItems);
                if (checked) newSelected.add(id);
                else newSelected.delete(id);
                setSelectedItems(newSelected);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}