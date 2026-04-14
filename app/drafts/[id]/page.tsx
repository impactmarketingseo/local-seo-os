'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { cn, formatDateTime } from '@/lib/utils';

interface DraftSection {
  heading: string;
  content: string;
  order: number;
}

interface DraftFAQ {
  question: string;
  answer: string;
}

interface Draft {
  id: string;
  title: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  h1: string;
  intro: string;
  sections: DraftSection[];
  faqs: DraftFAQ[];
  cta_block: string;
  internal_links: { title: string; url: string }[];
  content_text: string;
  status: string;
  version_number: number;
  created_at: string;
  client_id: string;
  queue_id: string;
  clients: { name: string } | null;
}

export default function DraftDetailPage() {
  const router = useRouter();
  const params = useParams();
  const draftId = params.id as string;
  
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'json' | 'export'>('preview');
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    async function loadDraft() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.from('drafts').select(`
        *,
        clients(name)
      `).eq('id', draftId).single();
      
      if (data) {
        setDraft(data as any);
        setEditedContent(data.content_text || '');
      }
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

  async function handleSaveEdit() {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('drafts').update({ 
      content_text: editedContent,
      status: 'review',
    }).eq('id', draftId);
    setEditing(false);
    if (draft) setDraft({ ...draft, content_text: editedContent, status: 'review' });
  }

  async function handleExport() {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('publishing_logs').insert({
      draft_id: draftId,
      client_id: draft?.client_id,
      action_type: 'export',
      destination: 'manual',
      success: true,
    });
    alert('Draft marked as exported');
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (!draft) {
    return <div className="p-6">Draft not found</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:underline">
            ← Back to Drafts
          </button>
          <h1 className="mt-2 text-2xl font-bold">{draft.title || 'Untitled Draft'}</h1>
          <p className="text-muted-foreground">
            {draft.clients?.name} · v{draft.version_number} · {formatDateTime(draft.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full px-3 py-1.5 text-sm capitalize',
            draft.status === 'draft' && 'bg-gray-100',
            draft.status === 'review' && 'bg-yellow-100 text-yellow-800',
            draft.status === 'approved' && 'bg-green-100 text-green-800',
            draft.status === 'rejected' && 'bg-red-100 text-red-800',
          )}>
            {draft.status}
          </span>
        </div>
      </div>

      <div className="mb-4 flex gap-2 border-b">
        {(['preview', 'json', 'export'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize',
              activeTab === tab
                ? 'border-b-2 border-primary -mb-px text-primary'
                : 'text-muted-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Core SEO Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Title</p>
              <p className="font-medium">{draft.title || 'Not set'}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">URL Slug</p>
              <p className="font-medium">{draft.slug || 'Not set'}</p>
            </div>
          </div>

          {draft.h1 && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">H1</p>
              <p className="text-xl font-bold">{draft.h1}</p>
            </div>
          )}

          {draft.meta_description && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Meta Description</p>
              <p>{draft.meta_description}</p>
            </div>
          )}

          {/* Additional Keywords */}
          {(draft as any).additional_keywords && (draft as any).additional_keywords?.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-2">Additional Keywords</p>
              <div className="flex flex-wrap gap-2">
                {(draft as any).additional_keywords.map((kw: string, i: number) => (
                  <span key={i} className="bg-secondary px-2 py-1 rounded text-sm">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Schema */}
          {(draft as any).schema_notes && Object.keys((draft as any).schema_notes).length > 0 && (
            <div className="rounded-lg border border-green-500 bg-card p-4">
              <p className="text-sm text-green-600 font-semibold mb-2">Schema Markup</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify((draft as any).schema_notes, null, 2)}
              </pre>
            </div>
          )}
            <p className="text-sm text-muted-foreground">Introduction</p>
            <p>{draft.intro || 'Not set'}</p>
          </div>

          {draft.sections && draft.sections.length > 0 && (
            <div className="space-y-4">
              {draft.sections.map((section, i) => (
                <div key={i} className="rounded-lg border bg-card p-4">
                  <h3 className="font-semibold">{section.heading}</h3>
                  <p className="mt-2">{section.content}</p>
                </div>
              ))}
            </div>
          )}

          {draft.faqs && draft.faqs.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-4 font-semibold">FAQs</h3>
              <div className="space-y-4">
                {draft.faqs.map((faq, i) => (
                  <div key={i}>
                    <p className="font-medium">{faq.question}</p>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {draft.cta_block && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">CTA</p>
              <p className="mt-1 font-medium">{draft.cta_block}</p>
            </div>
          )}

          {draft.internal_links && draft.internal_links.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Internal Link Suggestions</p>
              <div className="mt-2 space-y-1">
                {draft.internal_links.map((link, i) => (
                  <p key={i} className="text-sm">
                    <span className="text-primary">{link.title}</span>
                    <span className="text-muted-foreground"> → {link.url}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {draft.content_text && (
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Full Content</p>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-sm text-primary hover:underline"
                >
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {editing ? (
                <textarea
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={20}
                />
              ) : (
                <div className="mt-2 whitespace-pre-wrap">{draft.content_text}</div>
              )}
              {editing && (
                <button
                  onClick={handleSaveEdit}
                  className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Save Changes
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'json' && (
        <div className="rounded-lg border bg-card p-4">
          <pre className="overflow-x-auto text-sm">
            {(() => {
              try {
                return JSON.stringify(draft.content_text ? JSON.parse(draft.content_text) : draft, null, 2);
              } catch {
                return JSON.stringify(draft, null, 2);
              }
            })()}
          </pre>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Export Options</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Copy the content below to paste into your Elementor template.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Mark as Exported
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(draft.content_text || '');
                alert('Copied to clipboard');
              }}
              className="rounded-lg border bg-background px-4 py-2 text-sm font-medium"
            >
              Copy to Clipboard
            </button>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <pre className="whitespace-pre-wrap text-sm">{draft.content_text}</pre>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3 border-t pt-6">
        {(draft.status === 'draft' || draft.status === 'review') && (
          <>
            <button
              onClick={handleApprove}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Approve Draft
            </button>
            <button
              onClick={handleReject}
              className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
            >
              Reject Draft
            </button>
          </>
        )}
        {draft.status === 'approved' && (
          <button
            onClick={handleExport}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Send to WordPress
          </button>
        )}
      </div>
    </div>
  );
}