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
  const [activeTab, setActiveTab] = useState<'seo' | 'keywords' | 'schema' | 'content'>('seo');

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

  if (loading) return <div className="p-4 text-muted-foreground">Loading...</div>;
  if (!draft) return <div className="p-4">Draft not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-sm text-blue-600">← Back</button>
        <h1 className="text-lg font-bold mt-1 line-clamp-1">{draft.title}</h1>
      </div>

      {/* Tabs - scrollable on mobile */}
      <div className="bg-white border-b flex overflow-x-auto">
        {(['seo', 'keywords', 'schema', 'content'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
            {tab === 'seo' ? 'SEO' : tab === 'keywords' ? 'Keywords' : tab === 'schema' ? 'Schema' : 'Content'}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-3">
            <div className="bg-white rounded-lg border p-3">
              <p className="text-xs text-gray-500 uppercase">Title</p>
              <p className="font-medium text-sm">{draft.title}</p>
            </div>
            <div className="bg-white rounded-lg border p-3">
              <p className="text-xs text-gray-500 uppercase">URL Slug</p>
              <p className="font-mono text-sm">/{draft.slug}</p>
            </div>
            {draft.h1 && (
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-gray-500 uppercase">H1</p>
                <p className="font-bold">{draft.h1}</p>
              </div>
            )}
            {draft.meta_description && (
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-gray-500 uppercase">Meta Description</p>
                <p className="text-sm">{draft.meta_description}</p>
              </div>
            )}
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div className="space-y-3">
            {draft.additional_keywords?.length > 0 && (
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-gray-500 uppercase mb-2">Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {draft.additional_keywords.map((kw, i) => (
                    <span key={i} className="bg-blue-50 px-2 py-1 rounded-full text-xs text-blue-700">{kw}</span>
                  ))}
                </div>
              </div>
            )}
            {draft.internal_links?.length > 0 && (
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-gray-500 uppercase mb-2">Internal Links</p>
                <div className="space-y-1">
                  {draft.internal_links.map((link, i) => (
                    <div key={i} className="text-sm text-blue-600">{link.title}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schema Tab */}
        {activeTab === 'schema' && (
          <div className="space-y-3">
            <div className="bg-green-900 rounded-lg border border-green-500 p-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-green-400 font-semibold">JSON-LD Schema</p>
                <button onClick={() => navigator.clipboard.writeText(JSON.stringify(draft.schema_notes, null, 2))}
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                  Copy
                </button>
              </div>
              <pre className="text-xs text-green-400 overflow-x-auto">
                {JSON.stringify(draft.schema_notes, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-3">
            <button onClick={() => navigator.clipboard.writeText(draft.content_text || '')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
              Copy All Content
            </button>
            <div className="bg-white rounded-lg border p-3">
              <pre className="text-xs whitespace-pre-wrap">{draft.content_text}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {(draft.status === 'draft' || draft.status === 'review') && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex gap-2">
          <button onClick={handleApprove} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium">
            Approve
          </button>
          <button onClick={handleReject} className="flex-1 bg-red-100 text-red-800 py-3 rounded-lg font-medium">
            Reject
          </button>
        </div>
      )}
      
      {/* Spacer for fixed bottom buttons */}
      {(draft.status === 'draft' || draft.status === 'review') && <div className="h-20" />}
    </div>
  );
}