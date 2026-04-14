'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { cn, formatDateTime } from '@/lib/utils';

interface DashboardStats {
  clients_count: number;
  queue_pending: number;
  drafts_review: number;
  published_recent: number;
}

interface RecentDraft {
  id: string;
  title: string;
  status: string;
  created_at: string;
  client_name: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDrafts, setRecentDrafts] = useState<RecentDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createSupabaseBrowserClient();
      
      const [clientsRes, queueRes, draftsRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('page_queue').select('id', { count: 'exact', head: true }).in('status', ['planned', 'approved']),
        supabase.from('drafts').select('id, title, status, created_at, client_id, clients(name)').in('status', ['draft', 'review']).order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        clients_count: clientsRes.count || 0,
        queue_pending: queueRes.count || 0,
        drafts_review: draftsRes.data?.length || 0,
        published_recent: 0,
      });

      if (draftsRes.data) {
        setRecentDrafts(draftsRes.data.map((d: any) => ({
          id: d.id,
          title: d.title || 'Untitled',
          status: d.status,
          created_at: d.created_at,
          client_name: d.clients?.name || 'Unknown',
        })));
      }
      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Clients"
          value={stats?.clients_count ?? 0}
          href="/clients"
        />
        <StatCard
          label="Queue Items Pending"
          value={stats?.queue_pending ?? 0}
          href="/queue"
        />
        <StatCard
          label="Drafts Need Review"
          value={stats?.drafts_review ?? 0}
          href="/drafts"
        />
        <StatCard
          label="Published This Week"
          value={stats?.published_recent ?? 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent Drafts</h2>
          {recentDrafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No drafts yet</p>
          ) : (
            <div className="space-y-3">
              {recentDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between rounded-lg border bg-background p-3"
                >
                  <div>
                    <p className="font-medium">{draft.title}</p>
                    <p className="text-xs text-muted-foreground">{draft.client_name}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      'inline-block rounded-full px-2 py-1 text-xs',
                      draft.status === 'draft' && 'bg-muted text-muted-foreground',
                      draft.status === 'review' && 'bg-yellow-100 text-yellow-800',
                      draft.status === 'approved' && 'bg-green-100 text-green-800',
                    )}>
                      {draft.status}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(draft.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid gap-3">
            <a
              href="/clients/new"
              className="rounded-lg border bg-background p-4 transition-colors hover:bg-accent"
            >
              <p className="font-medium">Add New Client</p>
              <p className="text-sm text-muted-foreground">Create a new client record</p>
            </a>
            <a
              href="/queue/new"
              className="rounded-lg border bg-background p-4 transition-colors hover:bg-accent"
            >
              <p className="font-medium">Add to Queue</p>
              <p className="text-sm text-muted-foreground">Plan new content</p>
            </a>
            <a
              href="/drafts"
              className="rounded-lg border bg-background p-4 transition-colors hover:bg-accent"
            >
              <p className="font-medium">Review Drafts</p>
              <p className="text-sm text-muted-foreground">View all pending drafts</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }
  return content;
}