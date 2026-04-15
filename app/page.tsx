'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface DashboardStats {
  clients_count: number;
  drafts_review: number;
  published_recent: number;
  queue_count: number;
}

interface AttentionItem {
  id: string;
  type: string;
  client_name: string;
  title: string;
  issue: string;
  action_label: string;
  action_href: string;
}

interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  client_name: string;
  created_at: string;
}

function StatCard({ label, value, trend, trendUp, highlight }: { label: string; value: number; trend?: string; trendUp?: boolean; highlight?: boolean }) {
  return (
    <div className={`card-standard ${highlight ? 'glow-pulse' : ''}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-4xl font-bold text-text-primary">{value}</p>
        {trend && (
          <span className={`flex items-center text-sm font-medium ${trendUp ? 'text-success' : 'text-error'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="card-standard">
      <div className="skeleton h-4 w-24 mb-2" />
      <div className="skeleton h-10 w-16" />
    </div>
  );
}

import type { ReactNode } from 'react';

function AttentionCard({ item, delay }: { item: AttentionItem; delay?: number }) {
  const typeColors: Record<string, string> = {
    draft: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    qa_fail: 'bg-error/10 text-error',
    stalled: 'bg-input text-text-tertiary',
  };

  const typeIcons: Record<string, ReactNode> = {
    draft: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    error: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    qa_fail: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    stalled: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  };

  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-accent/30 transition-all animate-slide-up" 
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeColors[item.type] || 'bg-input text-text-tertiary'}`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {typeIcons[item.type]}
          </svg>
        </div>
        <div>
          <p className="font-medium text-text-primary">{item.client_name}</p>
          <p className="text-sm text-text-tertiary">{item.title}</p>
          <p className="text-xs text-error font-medium">{item.issue}</p>
        </div>
      </div>
      <Link href={item.action_href} className="btn-primary text-sm">
        {item.action_label}
      </Link>
    </div>
  );
}

function ActivityItem({ event }: { event: ActivityEvent }) {
  const typeColors: Record<string, string> = {
    published: 'bg-success/10 text-success',
    approved: 'bg-accent/10 text-accent',
    generated: 'bg-info/10 text-info',
    client_added: 'bg-input text-text-tertiary',
  };

  const typeIcons: Record<string, ReactNode> = {
    published: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />,
    approved: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    generated: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />,
    client_added: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />,
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${typeColors[event.type] || 'bg-input'}`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {typeIcons[event.type]}
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium text-text-primary">{event.client_name}</span>
          <span className="text-text-secondary"> — {event.description}</span>
        </p>
        <p className="text-xs text-text-disabled">{timeAgo(event.created_at)}</p>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, label, description, href, delay }: { icon: ReactNode; label: string; description: string; href: string; delay?: number }) {
  return (
    <Link 
      href={href} 
      className="group card-standard hover:border-accent/40 animate-scale-in"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
      <p className="mt-3 font-semibold text-text-primary">{label}</p>
      <p className="mt-1 text-sm text-text-tertiary">{description}</p>
    </Link>
  );
}

function EmptyAttention() {
  return (
    <div className="rounded-lg bg-success/10 p-6 text-center">
      <svg className="w-12 h-12 mx-auto text-success mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="font-semibold text-success">All caught up!</p>
      <p className="text-sm text-success/80">No items need your attention</p>
    </div>
  );
}

function EmptyState({ icon, title, description, action, actionHref }: { icon: ReactNode; title: string; description: string; action: string; actionHref: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-10 text-center">
      <div className="flex h-14 w-14 mx-auto mb-4 items-center justify-center rounded-full bg-input">
        <svg className="h-7 w-7 text-text-disabled" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
      <h3 className="font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-tertiary mt-1">{description}</p>
      <Link href={actionHref} className="btn-primary mt-4 text-sm">
        {action}
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createSupabaseBrowserClient();
      
      const [clientsRes, queueRes, draftsRes, recentRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('page_queue').select('id', { count: 'exact', head: true }),
        supabase.from('drafts').select('id, title, status, created_at, clients(name)').in('status', ['draft', 'review']).order('created_at', { ascending: false }).limit(5),
        supabase.from('drafts').select('id, title, status, created_at, clients(name)').order('created_at', { ascending: false }).limit(10),
      ]);

      setStats({
        clients_count: clientsRes.count || 0,
        queue_count: queueRes.count || 0,
        drafts_review: draftsRes.data?.length || 0,
        published_recent: 0,
      });

      const attention: AttentionItem[] = [];
      if (draftsRes.data) {
        draftsRes.data.forEach((d: any) => {
          attention.push({
            id: d.id,
            type: 'draft',
            client_name: d.clients?.name || 'Unknown',
            title: d.title || 'Untitled Draft',
            issue: 'Ready for review',
            action_label: 'Review',
            action_href: `/drafts/${d.id}`,
          });
        });
      }
      setAttentionItems(attention.slice(0, 5));

      const events: ActivityEvent[] = [];
      if (recentRes.data) {
        recentRes.data.forEach((d: any) => {
          events.push({
            id: d.id,
            type: d.status === 'approved' ? 'approved' : 'generated',
            description: d.title || 'New draft generated',
            client_name: d.clients?.name || 'Unknown',
            created_at: d.created_at,
          });
        });
      }
      setActivityEvents(events);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-text-tertiary mt-1">Your content operations war room</p>
        </div>
      </div>
      
      {/* Top Stats Row */}
      <div className="radial-glow pb-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard label="Active Clients" value={stats?.clients_count ?? 0} trend="+2 this month" trendUp highlight />
              <StatCard label="Pages in Production" value={stats?.queue_count ?? 0} />
              <StatCard label="Pending Reviews" value={stats?.drafts_review ?? 0} />
              <StatCard label="Published This Month" value={stats?.published_recent ?? 0} />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attention Queue */}
        <div className="card-standard">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Needs Your Attention</h2>
            <Link href="/drafts" className="text-sm text-accent hover:underline">View All</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-16" />
              ))}
            </div>
          ) : attentionItems.length === 0 ? (
            <EmptyAttention />
          ) : (
            <div className="space-y-3">
              {attentionItems.map((item, index) => (
                <AttentionCard key={item.id} item={item} delay={(index + 1) * 50} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="card-standard">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <QuickActionCard 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />}
              label="Add New Client" 
              description="Create a new client record" 
              href="/clients/new"
              delay={100}
            />
            <QuickActionCard 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 657l5.525-5.525M2 12h6m11 0h6m-2.638-7.364l-5.099 5.099M19.364 4.636l-5.099 5.099M12 22V2" />}
              label="Run City Pages" 
              description="Generate city+service pages" 
              href="/queue/new"
              delay={150}
            />
            <QuickActionCard 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
              label="View Queue" 
              description="Monitor content pipeline" 
              href="/queue"
              delay={200}
            />
            <QuickActionCard 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
              label="Review Drafts" 
              description="Approve or revise content" 
              href="/drafts"
              delay={250}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="card-standard mt-6">
        <h2 className="section-title mb-4">Recent Activity</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-10" />
            ))}
          </div>
        ) : activityEvents.length === 0 ? (
          <EmptyState 
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
            title="No recent activity"
            description="Your activity will appear here"
            action="Add Client"
            actionHref="/clients/new"
          />
        ) : (
          <div className="divide-y divide-border/30">
            {activityEvents.map((event) => (
              <ActivityItem key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}