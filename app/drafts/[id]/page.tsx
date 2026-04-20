'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { toast } from '@/components/Toast';

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
  queue_id?: string;
  clients: { name: string } | null;
}

export default function DraftDetailPage() {
  const router = useRouter();
  const params = useParams();
  const draftId = params.id as string;
  
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'seo' | 'hero' | 'problems' | 'why' | 'process' | 'faq' | 'local' | 'links' | 'schema'>('seo');
  const [showDelete, setShowDelete] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    async function loadDraft() {
      const supabase = createSupabaseBrowserClient();
      // Query just drafts - content is in content_json
      const { data: draftData } = await supabase
        .from('drafts')
        .select('*')
        .eq('id', draftId)
        .single();
      
      if (draftData) {
        setDraft(draftData);
        const c = draftData.content_json || {};
        console.log('Full content:', JSON.stringify(c).substring(0, 500));
        console.log('Content keys:', Object.keys(c));
        setContent(c);
        
        // Calculate word count from content_json
        let text = '';
        if (draftData.content_json) {
          text = JSON.stringify(draftData.content_json);
        } else if (draftData.content_text) {
          text = draftData.content_text;
        }
        setWordCount(text.split(/\s+/).filter(Boolean).length);
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

  async function handleDelete() {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('drafts').delete().eq('id', draftId);
    router.push('/drafts');
  }

  async function handleRegenerate() {
    if (!draft?.queue_id) {
      toast('No queue item found for this draft', 'error');
      return;
    }
    
    setRegenerating(true);
    
    try {
      const response = await fetch('/api/generate/queue-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_item_id: draft.queue_id, regenerate: true }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Delete the old draft since regeneration created a new one
        const supabase = createSupabaseBrowserClient();
        await supabase.from('drafts').delete().eq('id', draftId);
        
        toast('Content regenerated!', 'success');
        
        // Navigate to the new draft
        if (result.draft_id) {
          router.push('/drafts/' + result.draft_id);
        } else {
          router.refresh();
        }
      } else {
        toast(result.error || 'Regeneration failed', 'error');
      }
    } catch (e) {
      toast('Error: ' + e, 'error');
    }
    
    setRegenerating(false);
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
        <div className="flex items-center gap-3">
          {draft.queue_id && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="btn-secondary text-sm"
            >
              {regenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin mr-2 inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Regenerating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </>
              )}
            </button>
          )}
          <button
              onClick={() => {
                const json = JSON.stringify(draft.content_json || draft, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${draft.slug || 'draft'}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn-ghost text-sm"
              title="Export as JSON"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <span className={`px-3 py-1.5 rounded-md text-sm font-medium ${status.bg} ${status.text}`}>
            {draft.status}
          </span>
          <button
            onClick={async () => {
              const nextStatus = draft.status === 'draft' ? 'review' : draft.status === 'review' ? 'approved' : 'draft';
              const supabase = createSupabaseBrowserClient();
              await supabase.from('drafts').update({ status: nextStatus }).eq('id', draftId);
              setDraft({ ...draft, status: nextStatus });
            }}
            className="btn-secondary text-sm"
          >
            {draft.status === 'draft' ? 'Submit for Review' : draft.status === 'review' ? 'Approve' : 'Revert'}
          </button>
        </div>
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
            <span className="text-text-disabled text-xs uppercase tracking-wider">Words</span>
            <p className="text-text-secondary">{wordCount}</p>
          </div>
          <div>
            <span className="text-text-disabled text-xs uppercase tracking-wider">Status</span>
            <p className={`${status.text} font-medium`}>{draft.status}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-border">
        {(['seo', 'hero', 'problems', 'why', 'process', 'faq', 'local', 'links', 'schema'] as const).map((tab) => (
          <button type="button" key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-accent text-accent' 
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}>
            {tab === 'seo' ? 'SEO' : tab === 'hero' ? 'Hero' : tab === 'problems' ? 'Problems' : tab === 'why' ? 'Why Us' : tab === 'process' ? 'Process' : tab === 'faq' ? 'FAQ' : tab === 'local' ? 'Local' : tab === 'links' ? 'Links' : 'Schema'}
          </button>
        ))}
      </div>

      <div className="pb-24">
        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-4">
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Title Tag</p>
              <p className="font-medium text-text-primary">{content?.meta?.title || draft.title}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">URL Slug</p>
              <p className="mono text-text-secondary">/{content?.meta?.slug || draft.slug}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Meta Description</p>
              <p className="text-text-secondary">{content?.meta?.description || draft.meta_description}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">H1</p>
              <p className="font-bold text-text-primary">{content?.meta?.h1 || draft.h1}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Breadcrumb</p>
              <p className="text-text-secondary">{content?.breadcrumb}</p>
            </div>
          </div>
        )}

        {/* Hero Tab */}
        {activeTab === 'hero' && content?.hero && (
          <div className="space-y-4">
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Review Line</p>
              <p className="text-text-primary">{content.hero.review_line}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Intro Paragraph</p>
              <p className="text-text-secondary whitespace-pre-wrap">{content.hero.intro_paragraph}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">CTA Primary</p>
              <p className="text-text-primary">{content.hero.cta_primary_text}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">CTA Secondary</p>
              <p className="text-text-primary">{content.hero.cta_secondary_text}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Trust Badges</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {content.hero.trust_badges?.map((badge: string, i: number) => (
                  <span key={i} className="badge">{badge}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Problems Tab */}
        {activeTab === 'problems' && content?.problems && (
          <div className="space-y-4">
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Section Heading</p>
              <p className="font-medium text-text-primary">{content.problems.section_heading}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Section Subtext</p>
              <p className="text-text-secondary">{content.problems.section_subtext}</p>
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mt-4">Problem Cards</p>
            {content.problems.cards?.map((card: any, i: number) => (
              <div key={i} className="card-standard">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{card.icon}</span>
                  <div>
                    <p className="font-medium text-text-primary">{card.title}</p>
                    <p className="text-sm text-text-secondary mt-1">{card.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Why Choose Us Tab */}
        {activeTab === 'why' && content?.why_choose_us && (
          <div className="space-y-4">
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Section Heading</p>
              <p className="font-medium text-text-primary">{content.why_choose_us.section_heading}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Section Subtext</p>
              <p className="text-text-secondary">{content.why_choose_us.section_subtext}</p>
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mt-4">Items</p>
            {content.why_choose_us.items?.map((item: any, i: number) => (
              <div key={i} className="card-standard">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-medium text-text-primary">{item.title}</p>
                    <p className="text-sm text-text-secondary mt-1">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Process Tab */}
        {activeTab === 'process' && content?.process && (
          <div className="space-y-4">
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Section Heading</p>
              <p className="font-medium text-text-primary">{content.process.section_heading}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Section Subtext</p>
              <p className="text-text-secondary">{content.process.section_subtext}</p>
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mt-4">Steps</p>
            {content.process.steps?.map((step: any, i: number) => (
              <div key={i} className="card-standard">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{step.icon}</span>
                  <div>
                    <p className="font-medium text-text-primary">{step.title}</p>
                    <p className="text-sm text-text-secondary mt-1">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && content?.faq && (
          <div className="space-y-4">
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Section Heading</p>
              <p className="font-medium text-text-primary">{content.faq.section_heading}</p>
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mt-4">Questions</p>
            {content.faq.items?.map((item: any, i: number) => (
              <div key={i} className="card-standard">
                <p className="font-medium text-text-primary mb-2">Q: {item.question}</p>
                <p className="text-sm text-text-secondary">A: {item.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Local Context Tab */}
        {activeTab === 'local' && content?.local_context && (
          <div className="space-y-4">
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Section Heading</p>
              <p className="font-medium text-text-primary">{content.local_context.section_heading}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Paragraph 1</p>
              <p className="text-text-secondary whitespace-pre-wrap">{content.local_context.paragraph_1}</p>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Paragraph 2</p>
              <p className="text-text-secondary whitespace-pre-wrap">{content.local_context.paragraph_2}</p>
            </div>
          </div>
        )}

        {/* Internal Links Tab */}
        {activeTab === 'links' && content?.internal_links && (
          <div className="space-y-4">
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Other Services in {(draft as any)?.cities?.name || 'City'}</p>
              {content.internal_links.other_services_in_city?.map((link: any, i: number) => (
                <a key={i} href={link.url} className="block text-accent hover:underline py-1">{link.text}</a>
              ))}
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">{(draft as any)?.services?.name || 'Service'} in Other Cities</p>
              {content.internal_links.same_service_other_cities?.map((link: any, i: number) => (
                <a key={i} href={link.url} className="block text-accent hover:underline py-1">{link.text}</a>
              ))}
            </div>
          </div>
        )}

        {/* Schema Tab */}
        {activeTab === 'schema' && content?.schema_markup && (
          <div className="space-y-4">
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Local Business Schema</p>
              <pre className="text-xs text-text-secondary whitespace-pre-wrap overflow-x-auto">{content.schema_markup.local_business}</pre>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">FAQ Page Schema</p>
              <pre className="text-xs text-text-secondary whitespace-pre-wrap overflow-x-auto">{content.schema_markup.faq_page}</pre>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Service Schema</p>
              <pre className="text-xs text-text-secondary whitespace-pre-wrap overflow-x-auto">{content.schema_markup.service}</pre>
            </div>
            <div className="card-standard">
              <p className="text-xs font-medium uppercase tracking-wider text-text-disabled mb-2">Breadcrumb Schema</p>
              <pre className="text-xs text-text-secondary whitespace-pre-wrap overflow-x-auto">{content.schema_markup.breadcrumb_list}</pre>
            </div>
          </div>
        )}

{/* Schema Tab */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            {(() => {
              const schema = content?.schema_markup || {};
              const localBusinessSchema = schema?.local_business || '';
              const faqPageSchema = schema?.faq_page || '';
              const serviceSchema = schema?.service || '';
              const breadcrumbSchema = schema?.breadcrumb_list || '';
              
              const hasAny = localBusinessSchema || faqPageSchema || serviceSchema || breadcrumbSchema;
              
              if (!hasAny) {
                return (
                  <div className="card-standard text-center">
                    <p className="text-text-tertiary">No schema generated</p>
                  </div>
                );
              }
              
              return (
                <>
                  {localBusinessSchema && (
                    <div className="card-standard">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-semibold text-text-primary">LocalBusiness Schema</p>
                        <button type="button" onClick={() => navigator.clipboard.writeText(localBusinessSchema)}
                          className="btn-secondary text-sm">
                          Copy
                        </button>
                      </div>
                      <pre className="text-xs bg-black/5 p-3 rounded overflow-x-auto text-text-secondary">
                        {localBusinessSchema.substring(0, 500)}...
                      </pre>
                    </div>
                  )}
                  {faqPageSchema && (
                    <div className="card-standard">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-semibold text-text-primary">FAQ Schema</p>
                        <button type="button" onClick={() => navigator.clipboard.writeText(faqPageSchema)}
                          className="btn-secondary text-sm">
                          Copy
                        </button>
                      </div>
                      <pre className="text-xs bg-black/5 p-3 rounded overflow-x-auto text-text-secondary">
                        {faqPageSchema.substring(0, 500)}...
                      </pre>
                    </div>
                  )}
                  {serviceSchema && (
                    <div className="card-standard">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-semibold text-text-primary">Service Schema</p>
                        <button type="button" onClick={() => navigator.clipboard.writeText(serviceSchema)}
                          className="btn-secondary text-sm">
                          Copy
                        </button>
                      </div>
                      <pre className="text-xs bg-black/5 p-3 rounded overflow-x-auto text-text-secondary">
                        {serviceSchema.substring(0, 500)}...
                      </pre>
                    </div>
                  )}
                  {breadcrumbSchema && (
                    <div className="card-standard">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-semibold text-text-primary">Breadcrumb Schema</p>
                        <button type="button" onClick={() => navigator.clipboard.writeText(breadcrumbSchema)}
                          className="btn-secondary text-sm">
                          Copy
                        </button>
                      </div>
                      <pre className="text-xs bg-black/5 p-3 rounded overflow-x-auto text-text-secondary">
                        {breadcrumbSchema}
                      </pre>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
                  {hasLocal && (
                    <div className="card-standard">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-semibold text-text-primary">Local Business Schema</p>
                        <button type="button" onClick={() => navigator.clipboard.writeText(JSON.stringify(localBusinessSchema, null, 2))}
                          className="btn-secondary text-sm">
                          Copy
                        </button>
                      </div>
                      <pre className="text-xs mono text-text-secondary overflow-x-auto bg-sidebar p-4 rounded-md">
                        {JSON.stringify(localBusinessSchema, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              );
            })()}
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
