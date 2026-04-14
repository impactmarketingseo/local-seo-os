'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { formatDateTime } from '@/lib/utils';

interface Draft {
  id: string;
  title: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  h1: string;
  intro: string;
  sections: { heading: string; content: string }[];
  faqs: { question: string; answer: string }[];
  cta_block: string;
  internal_links: { title: string; url: string }[];
  additional_keywords: string[];
  schema_notes: Record<string, unknown>;
  content_text: string;
  status: string;
  version_number: number;
  created_at: string;
  client_id: string;
  clients: { name: string } | null;
}

export default function DraftDetailPage() {
  const router = useRouter();
  const params = useParams();
  const draftId = params.id as string;
  
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'keywords' | 'schema' | 'content'>('preview');

  useEffect(() => {
    async function loadDraft() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.from('drafts').select('*, clients(name)').eq('id', draftId).single();
      if (data) setDraft(data);
      setLoading(false);
    }
    loadDraft();
  }, [draftId]);

  async function handleApprove() {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('drafts').update({ status: 'approved' }).eq('id', draftId);
    if (draft) setDraft({ ...draft, status: 'approved' });
  }

  async function handleReject() {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('drafts').update({ status: 'rejected' }).eq('id', draftId);
    if (draft) setDraft({ ...draft, status: 'rejected' });
  }

  async function handleExport() {
    await fetch('/api/generate/weekly', { method: 'POST' });
    alert('Content exported');
  }

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!draft) return <div className="p-6">Draft not found</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:underline">← Back</button>
          <h1 className="mt-2 text-2xl font-bold">{draft.title}</h1>
          <p className="text-muted-foreground">{draft.clients?.name} · v{draft.version_number} · {formatDateTime(draft.created_at)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${draft.status === 'approved' ? 'bg-green-100 text-green-800' : draft.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {draft.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b">
        {(['preview', 'keywords', 'schema', 'content'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-muted-foreground'}`}>
            {tab === 'keywords' ? 'Keywords' : tab === 'schema' ? 'Schema' : tab === 'content' ? 'Full Content' : 'SEO'}
          </button>
        ))}
      </div>

      {/* Preview Content */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Title & Slug */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">Title Tag</p>
            <p className="font-medium">{draft.title}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">URL Slug</p>
            <p className="font-mono text-sm">/{draft.slug}</p>
          </div>
          {draft.h1 && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase">H1</p>
              <p className="text-xl font-bold">{draft.h1}</p>
            </div>
          )}
          {draft.meta_description && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase">Meta Description</p>
              <p>{draft.meta_description}</p>
            </div>
          )}
        </div>
      )}

      {/* Keywords */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-semibold mb-3">Additional Keywords</p>
            <div className="flex flex-wrap gap-2">
              {draft.additional_keywords?.map((kw, i) => (
                <span key={i} className="bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-700">{kw}</span>
              ))}
            </div>
          </div>
          {draft.internal_links && draft.internal_links.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm font-semibold mb-3">Internal Link Suggestions</p>
              <div className="space-y-2">
                {draft.internal_links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-blue-600">{link.title}</span>
                    <span className="text-muted-foreground">{link.url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {draft.sections && draft.sections.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm font-semibold mb-3">Content Sections</p>
              <div className="space-y-2">
                {draft.sections.map((section, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{i + 1}.</span>
                    <span>{section.heading}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schema */}
      {activeTab === 'schema' && (
        <div className="rounded-lg border border-green-500 bg-card p-4">
          <p className="text-sm font-semibold text-green-600 mb-3">JSON-LD Schema</p>
          <pre className="text-xs bg-slate-900 text-green-400 p-4 rounded overflow-x-auto">
{JSON.stringify(draft.schema_notes, null, 2)}
          </pre>
          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(draft.schema_notes, null, 2))}
            className="mt-3 bg-green-600 text-white px-4 py-2 rounded text-sm">
            Copy Schema
          </button>
        </div>
      )}

      {/* Full Content */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <button onClick={() => navigator.clipboard.writeText(draft.content_text || '')}
            className="bg-blue-600 text-white px-4 py-2 rounded">
            Copy All Content
          </button>
          <div className="rounded-lg border bg-card p-4">
            <pre className="whitespace-pre-wrap text-sm">{draft.content_text}</pre>
          </div>
        </div>
      )}

      {/* Actions */}
      {(draft.status === 'draft' || draft.status === 'review') && (
        <div className="mt-6 flex gap-3 border-t pt-4">
          <button onClick={handleApprove} className="bg-green-600 text-white px-4 py-2 rounded">Approve</button>
          <button onClick={handleReject} className="bg-red-100 text-red-800 px-4 py-2 rounded">Reject</button>
        </div>
      )}
    </div>
  );
}