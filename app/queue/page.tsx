'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { cn, formatDate } from '@/lib/utils';

interface QueueItem {
  id: string;
  status: string;
  scheduled_for: string | null;
  priority: number;
  generation_mode: string;
  created_at: string;
  clients: { name: string; niche: string } | null;
  services: { name: string } | null;
  cities: { name: string; state: string } | null;
}

const statusColors: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-800',
  approved_for_gen: 'bg-blue-100 text-blue-800',
  generating: 'bg-yellow-100 text-yellow-800',
  draft_ready: 'bg-purple-100 text-purple-800',
  needs_review: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  exported: 'bg-teal-100 text-teal-800',
  sent_to_wp: 'bg-cyan-100 text-cyan-800',
  published: 'bg-green-200 text-green-900',
  archived: 'bg-gray-200 text-gray-700',
};

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadQueue() {
      const supabase = createSupabaseBrowserClient();
      
      let query = supabase.from('page_queue').select(`
        *,
        clients(name, niche),
        services(name),
        cities(name, state)
      `).order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      if (data) setItems(data as any);

      const { data: clientsData } = await supabase.from('clients').select('id, name').eq('status', 'active');
      if (clientsData) setClients(clientsData);
      setLoading(false);
    }

    loadQueue();
  }, [filter]);

  async function updateStatus(id: string, status: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('page_queue').update({ status }).eq('id', id);
    setItems(items.map(item => item.id === id ? { ...item, status } : item));
  }

  async function deleteItem(id: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('page_queue').delete().eq('id', id);
    setItems(items.filter(item => item.id !== id));
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Queue</h1>
        <Link
          href="/queue/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add to Queue
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm',
            filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
        >
          All
        </button>
        {['planned', 'approved', 'needs_review', 'published'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm capitalize',
              filter === status ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No queue items</p>
          <Link href="/queue/new" className="mt-2 inline-block text-sm font-medium hover:underline">
            Add your first item
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted text-left text-sm">
              <tr>
                <th className="p-3">Client</th>
                <th className="p-3">Target</th>
                <th className="p-3">Status</th>
                <th className="p-3">Scheduled</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">
                    <p className="font-medium">{item.clients?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{item.clients?.niche}</p>
                  </td>
                  <td className="p-3">
                    <p>{item.services?.name || 'No service'} in {item.cities?.name}, {item.cities?.state}</p>
                  </td>
                  <td className="p-3">
                    <span className={cn('inline-block rounded-full px-2 py-1 text-xs capitalize', statusColors[item.status] || 'bg-gray-100')}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {item.scheduled_for ? formatDate(item.scheduled_for) : '—'}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {item.status === 'planned' && (
                        <button
                          onClick={() => updateStatus(item.id, 'approved')}
                          className="rounded bg-green-100 px-2 py-1 text-xs text-green-800 hover:bg-green-200"
                        >
                          Approve
                        </button>
                      )}
                      {item.status === 'needs_review' && (
                        <Link
                          href={`/drafts?queue=${item.id}`}
                          className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 hover:bg-blue-200"
                        >
                          Review
                        </Link>
                      )}
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="rounded bg-red-100 px-2 py-1 text-xs text-red-800 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}