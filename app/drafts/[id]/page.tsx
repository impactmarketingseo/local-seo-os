'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

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
  const [activeTab, setActiveTab] = useState<'seo' | 'keywords' | 'schema' | 'content'>('seo');
  const [showDelete, setShowDelete] = useState(false);

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

  async function handleDelete() {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('drafts').delete().eq('id', draftId);
    router.push('/drafts');
  }

  if (loading) return <div className="p-4 text-muted-foreground">Loading...</div>;
  if (!draft) return <div className="p-4">Draft not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-blue-600">←</button>
            <div>
              <h1 className="font-bold text-lg leading-tight">{draft.title}</h1>
              <p className="text-sm text-gray-500">{draft.clients?.name}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs ${draft.status === 'approved' ? 'bg-green-100 text-green-700' : draft.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {draft.status}
          </span>
        </div>
      </div>

      {/* Context Bar */}
      <div className="bg-blue-50 border-b px-4 py-2">
        <div className="flex gap-4 text-xs">
          <div><span className="text-gray-500">Slug:</span> <span className="font-mono">/{draft.slug}</span></div>
          <div><span className="text-gray-500">Version:</span> v{draft.version_number}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b flex overflow-x-auto">
        {(['seo', 'keywords', 'schema', 'content'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
            {tab === 'seo' ? 'SEO' : tab === 'keywords' ? 'Keywords' : tab === 'schema' ? 'Schema' : 'Content'}
          </button>
        ))}
      </div>

      <div className="p-4 pb-24">
        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-3">
            <div className="bg-white rounded-lg border p-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Title Tag</p>
              <p className="font-medium text-sm">{draft.title}</p>
            </div>
            <div className="bg-white rounded-lg border p-3">
              <p className="text-xs text-gray-500 uppercase mb-1">URL Slug</p>
              <p className="font-mono text-sm">/{draft.slug}</p>
            </div>
            <div className="bg-white rounded-lg border p-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Meta Description</p>
              <p className="text-sm">{draft.meta_description}</p>
            </div>
            <div className="bg-white rounded-lg border p-3">
              <p className="text-xs text-gray-500 uppercase mb-1">H1</p>
              <p className="font-bold">{draft.h1}</p>
            </div>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div className="space-y-3">
            {draft.additional_keywords?.length > 0 && (
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-gray-500 uppercase mb-2">Target Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {draft.additional_keywords.map((kw, i) => (
                    <span key={i} className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-700">{kw}</span>
                  ))}
                </div>
              </div>
            )}
            {draft.internal_links?.length > 0 && (
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-gray-500 uppercase mb-2">Internal Links</p>
                {draft.internal_links.map((link, i) => (
                  <div key={i} className="text-sm text-blue-600">{link.title}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schema Tab */}
        {activeTab === 'schema' && (
          <div className="bg-green-900 rounded-lg border border-green-500 p-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-green-400 font-semibold">JSON-LD</p>
              <button onClick={() => navigator.clipboard.writeText(JSON.stringify(draft.schema_notes, null, 2))}
                className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                Copy
              </button>
            </div>
            <pre className="text-xs text-green-400 overflow-x-auto">
              {JSON.stringify(draft.schema_notes, null, 2)}
            </pre>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-3">
            <button onClick={() => navigator.clipboard.writeText(draft.content_text || '')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-sm">
              📋 Copy All Content
            </button>
            <div className="bg-white rounded-lg border p-3">
              <pre className="text-xs whitespace-pre-wrap">{draft.content_text}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {draft.status !== 'approved' && draft.status !== 'published' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3">
          <div className="flex gap-2">
            <button onClick={handleApprove} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium text-sm">
              ✓ Approve
            </button>
            <button onClick={() => setShowDelete(true)} className="px-4 py-2 rounded-lg text-sm text-red-600">
              🗑
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full">
            <h3 className="font-bold mb-2">Delete Draft?</h3>
            <p className="text-sm text-gray-600 mb-4">You can always generate a new version for this city+service.</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 rounded">Delete</button>
              <button onClick={() => setShowDelete(false)} className="flex-1 bg-gray-100 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}