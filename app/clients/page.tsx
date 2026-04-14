'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface Client {
  id: string;
  name: string;
  niche: string;
  website_url?: string;
  status: string;
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');

  useEffect(() => {
    async function loadClients() {
      const supabase = createSupabaseBrowserClient();
      let query = supabase.from('clients').select('*').order('name');
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query;
      if (!error && data) {
        setClients(data);
      }
      setLoading(false);
    }

    loadClients();
  }, [filter]);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Link
          href="/clients/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add Client
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {(['all', 'active', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {clients.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No clients yet</p>
          <Link href="/clients/new" className="mt-2 inline-block text-sm font-medium hover:underline">
            Add your first client
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
            >
              <h3 className="font-semibold">{client.name}</h3>
              <p className="text-sm text-muted-foreground">{client.niche}</p>
              {client.website_url && (
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  {client.website_url}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className={`inline-block rounded-full px-2 py-1 text-xs ${
                  client.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {client.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}