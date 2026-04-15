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
  service_schema: Record<string, unknown>;
  local_business_schema: Record<string, unknown>;
  content_text: string;
  content_json: Record<string, unknown>;
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
  const [activeTab, setActiveTab] = useState<'seo' | 'keywords' | 'schema' | 'sections' | 'content'>('seo');
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

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton h-64 rounded-lg" />
      </div>
    );
  }
  
  if (!draft) {
    return (
      <div className="p-6 lg:p-8">
        <div className="card-standard text-center">
          <p className="text-text-primary">Draft not found</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'bg-warning/10', text: 'text-warning' },
    review: { bg: 'bg-info/10', text: 'text-info' },
    approved: { bg: 'bg-success/10', text: 'text-success' },
    rejected: { bg: 'bg-error/10', text: 'text-error' },
  };
  const status = statusColors[draft.status] || statusColors.draft;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-md hover:bg-elevated text-text-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="font-bold text-xl text-text-primary leading-tight">{draft.title}</h1>
            <p className="text-sm text-text-tertiary">{draft.clients?.name}</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-md text-sm font-medium ${status.bg} ${status.text}`}>
          {draft.status}
        </span>
      </div>

      {/* Context Bar */}
      <div className="card-standard mb-6">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-text-disabled text-xs uppercase tracking-wider">Slug</span>
            <p className="mono text-text-secondary">/{draft.slug}</p>
          </div>
          <div>
            <span className="text-text-disabled text-xs uppercase tracking-wider">Version</span>
            <p className="text-text-secondary">v{draft.version_number}</p>
          </div>
          <div>
            <span className="text-text-disabled text-xs uppercase tracking-wider">Status</span>
            <p className={`${status.text} font-medium`}>{draft.status}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-border">
        {(['seo', 'keywords', 'schema', 'sections', 'content'] as const).map((tab) => (
          <button type="button" key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-accent text-accent' 
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}>
            {tab === 'seo' ? 'SEO' : tab === 'keywords' ? 'Keywords' : tab === 'schema' ? 'Schema' : tab === 'sections' ? 'Sections' : 'Content'}
          </button>
        ))}
      </div>

      <div className="pb-24">
        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-4">
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Title Tag</p>
              <p className="font-medium text-text-primary">{draft.title}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">URL Slug</p>
              <p className="mono text-text-secondary">/{draft.slug}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Meta Description</p>
              <p className="text-text-secondary">{draft.meta_description}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">H1</p>
              <p className="font-bold text-text-primary">{draft.h1}</p>
            </div>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div className="space-y-4">
            {draft.additional_keywords?.length > 0 && (
              <div className="card-standard">
                <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-3">Target Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {draft.additional_keywords.map((kw, i) => (
                    <span key={i} className="bg-accent/10 text-accent px-3 py-1 rounded-md text-sm">{kw}</span>
                  ))}
                </div>
              </div>
            )}
            {draft.internal_links?.length > 0 && (
              <div className="card-standard">
                <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-3">Internal Links</p>
                {draft.internal_links.map((link, i) => (
                  <div key={i} className="text-accent text-sm mb-1">{link.title}</div>
                ))}
              </div>
            )}
            {(!draft.additional_keywords?.length && !draft.internal_links?.length) && (
              <div className="card-standard text-center">
                <p className="text-text-tertiary">No keywords configured</p>
              </div>
            )}
          </div>
        )}

        {/* Schema Tab */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <div className="card-standard">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-text-primary">Service Schema</p>
                <button type="button" onClick={() => navigator.clipboard.writeText(JSON.stringify(draft.service_schema, null, 2))}
                  className="btn-secondary text-sm">
                  Copy
                </button>
              </div>
              <pre className="text-xs mono text-text-secondary overflow-x-auto bg-sidebar p-4 rounded-md">
                {JSON.stringify(draft.service_schema || {}, null, 2)}
              </pre>
            </div>
            <div className="card-standard">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-text-primary">Local Business Schema</p>
                <button type="button" onClick={() => navigator.clipboard.writeText(JSON.stringify(draft.local_business_schema, null, 2))}
                  className="btn-secondary text-sm">
                  Copy
                </button>
              </div>
              <pre className="text-xs mono text-text-secondary overflow-x-auto bg-sidebar p-4 rounded-md">
                {JSON.stringify(draft.local_business_schema || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Sections Tab */}
        {activeTab === 'sections' && draft.content_json && (
          <div className="space-y-4">
            {(() => {
              const sections = draft.content_json?.sections || [];
              const faqs = draft.content_json?.faqs || [];
              const hero = draft.content_json?.hero || '';
              const cta = draft.content_json?.cta_block || draft.content_json?.cta || '';
              
              return (
                <>
                  {hero && (
                    <div className="card-standard">
                      <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Hero Section</p>
                      <p className="text-text-secondary whitespace-pre-wrap">{String(hero)}</p>
                    </div>
                  )}
                  {sections.map((section: any, i: number) => (
                    <div key={i} className="card-standard">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-text-disabled">{section.heading}</p>
                        <button type="button" onClick={() => navigator.clipboard.writeText(section.content)} className="btn-secondary text-xs">Copy</button>
                      </div>
                      <p className="text-text-secondary whitespace-pre-wrap">{String(section.content)}</p>
                    </div>
                  ))}
                  {faqs.length > 0 && (
                    <div className="card-standard">
                      <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">FAQs</p>
                      {faqs.map((faq: any, i: number) => (
                        <div key={i} className="mb-3">
                          <p className="font-medium text-text-primary">{faq.question}</p>
                          <p className="text-text-secondary text-sm">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {cta && (
                    <div className="card-standard">
                      <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">CTA Block</p>
                      <p className="text-text-secondary whitespace-pre-wrap">{String(cta)}</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <button type="button" onClick={() => navigator.clipboard.writeText(draft.content_text || '')}
              className="btn-primary w-full">
              📋 Copy All Content
            </button>
            <div className="card-standard">
              <pre className="text-sm whitespace-pre-wrap text-text-secondary">{draft.content_text}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {draft.status !== 'approved' && draft.status !== 'published' && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
          <div className="flex gap-3 lg:ml-64">
            <button type="button" onClick={handleApprove} className="flex-1 btn-primary">
              ✓ Approve
            </button>
            <button type="button" onClick={handleReject} className="btn-secondary text-error">
              Reject
            </button>
            <button type="button" onClick={() => setShowDelete(true)} className="btn-ghost text-error">
              🗑
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-lg p-6 max-w-sm w-full animate-scale-in">
            <h3 className="font-semibold text-lg text-text-primary mb-2">Delete Draft?</h3>
            <p className="text-sm text-text-tertiary mb-4">This action cannot be undone. You can always generate a new version.</p>
            <div className="flex gap-3">
              <button type="button" onClick={handleDelete} className="flex-1 btn-danger">
                Delete Draft
              </button>
              <button type="button" onClick={() => setShowDelete(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
