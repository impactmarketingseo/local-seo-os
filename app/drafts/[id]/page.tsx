'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function DraftDetailPage() {
  const router = useRouter();
  const params = useParams();
  const draftId = params.id as string;
  
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [regenerating, setRegenerating] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    async function loadDraft() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from('drafts')
        .select('*')
        .eq('id', draftId)
        .single();
      
      if (data) {
        setDraft(data);
        // Calculate word count from content
        const c = data.content_json || {};
        const text = typeof c === 'object' ? JSON.stringify(c) : String(c || '');
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

  async function handleComplete() {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('drafts').update({ status: 'complete' }).eq('id', draftId);
    if (draft) setDraft({ ...draft, status: 'complete' });
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
      alert('No queue item found for this draft. Regenerate from the queue instead.');
      return;
    }
    
    setRegenerating(true);
    try {
      console.log('Regenerating with queue_id:', draft.queue_id);
      const response = await fetch('/api/generate/queue-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_item_id: draft.queue_id, regenerate: true }),
      });
      
      const result = await response.json();
      console.log('Regenerate response:', result);
      
      if (result.success) {
        const supabase = createSupabaseBrowserClient();
        await supabase.from('drafts').delete().eq('id', draftId);
        if (result.draft_id) {
          router.push('/drafts/' + result.draft_id);
        } else {
          router.refresh();
        }
      } else {
        alert(result.error || result.details || 'Regeneration failed');
      }
    } catch (e) {
      console.error('Regenerate error:', e);
      alert('Error: ' + e);
    }
    setRegenerating(false);
  }

  function handleExport() {
    const json = JSON.stringify(draft.content_json || draft, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.slug || 'draft'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    async function loadDraft() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from('drafts')
        .select('*')
        .eq('id', draftId)
        .single();
      
      if (data) {
        setDraft(data);
      }
      setLoading(false);
    }
    loadDraft();
  }, [draftId]);

  if (loading) return (
    <div className="min-h-screen bg-app flex items-center justify-center">
      <div className="text-text-primary">Loading...</div>
    </div>
  );
  if (!draft) return (
    <div className="min-h-screen bg-app flex items-center justify-center">
      <div className="text-text-primary">Draft not found</div>
    </div>
  );

  const content = draft.content_json || {};
  const title = draft.title || content.meta?.h1 || content.meta?.title || 'Untitled';
  
  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
    review: { bg: 'bg-blue-900/30', text: 'text-accent' },
    approved: { bg: 'bg-green-900/30', text: 'text-green-400' },
    complete: { bg: 'bg-purple-900/30', text: 'text-purple-400' },
    rejected: { bg: 'bg-red-900/30', text: 'text-red-400' },
  };
  const statusKey = String(draft?.status || 'draft');
  const status = statusColors[statusKey] || statusColors.draft;

  const primaryKeyword = content.meta?.primary_keyword || content.meta?.h1?.replace(/\|.*$/, '').trim() || title;
  const secondaryKeywords = content.meta?.secondary_keywords || content.meta?.keywords || [
    `${title.split(' ')[0]} ${title.split(' ').slice(1, 3).join(' ')} near me`,
    `best ${title.split(' ').slice(0, 3).join(' ')}`,
    `${title.split(' ')[0]} services in local area`,
    `affordable ${title.split(' ').slice(0, 2).join(' ')}`,
    `professional ${title.split(' ').slice(0, 2).join(' ')}`,
    `24/7 ${title.split(' ')[0]} service`,
  ].slice(0, 7);

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-5xl mx-auto p-3 md:p-6">
        <button onClick={() => router.back()} className="mb-4 md:mb-6 text-accent hover:text-accent text-sm md:text-base">← Back to Drafts</button>
        
        <div className="bg-card rounded-xl p-4 md:p-6 mb-4 md:mb-6 border border-border">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <button onClick={() => router.back()} className="text-text-tertiary hover:text-text-primary p-1">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-text-primary leading-tight">{String(title)}</h1>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2">
                  <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${status.bg} ${status.text}`}>
                    {String(draft?.status)}
                  </span>
                  <span className="text-text-tertiary text-xs md:text-sm">{wordCount} words</span>
                  <span className="text-text-disabled text-xs md:text-sm">v{draft?.version_number || 1}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleRegenerate} 
                disabled={regenerating}
                className="px-3 md:px-4 py-2 bg-gray-700 hover:bg-elevated text-text-primary rounded-lg text-xs md:text-sm"
              >
                {regenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button 
                onClick={handleExport}
                className="px-3 md:px-4 py-2 bg-gray-700 hover:bg-elevated text-text-primary rounded-lg text-xs md:text-sm"
              >
                Export
              </button>
            </div>
          </div>
          <p className="text-text-tertiary">{content.meta?.description}</p>
        </div>

        <div className="bg-card rounded-xl border border-border mb-6">
          <div className="border-b border-border">
            <div className="flex overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
              {['preview', 'seo', 'hero', 'about', 'problems', 'why', 'process', 'faq', 'local', 'links', 'schema'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 md:px-5 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 capitalize whitespace-nowrap ${
                    activeTab === tab 
                      ? 'border-accent text-accent' 
                      : 'border-transparent text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'preview' && (
              <div className="space-y-8">
                {content.hero && (
                  <section className="bg-elevated p-4 md:p-8 rounded-xl border border-border">
                    <h1 className="text-lg md:text-2xl md:text-4xl font-bold text-text-primary mb-3 md:mb-4">{content.hero.h1 || title}</h1>
                    <p className="text-base md:text-xl text-text-secondary mb-4 md:mb-6">{content.hero.intro_paragraph}</p>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                      <button className="px-4 md:px-6 py-2 md:py-3 bg-accent text-text-primary rounded-lg font-medium hover:bg-accent-hover text-sm md:text-base">{content.hero.cta_primary_text || 'Get Started'}</button>
                      <button className="px-4 md:px-6 py-2 md:py-3 border border-border text-text-secondary rounded-lg font-medium hover:bg-elevated text-sm md:text-base">{content.hero.cta_secondary_text || 'Learn More'}</button>
                    </div>
                    <p className="mt-3 md:mt-4 text-xs md:text-sm text-text-disabled">{content.hero.review_line}</p>
                    <div className="flex flex-wrap gap-2 md:gap-3 mt-3 md:mt-4">
                      {content.hero.trust_badges?.map((badge: string, i: number) => (
                        <span key={i} className="text-xs md:text-sm text-text-tertiary bg-gray-700/50 px-2 md:px-3 py-1 md:py-1.5 rounded border border-border">{badge}</span>
                      ))}
                    </div>
                  </section>
                )}

                {content.trust_strip && (
                  <section className="bg-elevated p-6 rounded-xl border border-border">
                    <div className="flex flex-wrap gap-6">
                      {content.trust_strip.map((item: string, i: number) => (
                        <span key={i} className="text-sm text-text-secondary">✓ {item}</span>
                      ))}
                    </div>
                  </section>
                )}

                {content.about_service && (
                  <section className="bg-elevated p-8 rounded-xl border border-border">
                    <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-2">{content.about_service.section_heading}</h2>
                    <p className="text-lg text-accent mb-4">{content.about_service.subheading}</p>
                    <p className="text-text-secondary leading-relaxed mb-4">{content.about_service.paragraph_1}</p>
                    <p className="text-text-secondary leading-relaxed">{content.about_service.paragraph_2}</p>
                  </section>
                )}

                {content.problems && (
                  <section className="bg-elevated p-8 rounded-xl border border-border">
                    <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-2">{content.problems.section_heading}</h2>
                    <p className="text-text-tertiary mb-6">{content.problems.section_subtext}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {content.problems.cards?.map((card: any, i: number) => (
                        <div key={i} className="p-4 bg-app border border-border rounded-lg">
                          <div className="flex items-start gap-3">
                            <span className="text-xl">{card.icon?.replace('fa ', 'fa-')}</span>
                            <div>
                              <h3 className="font-semibold text-text-primary">{card.title}</h3>
                              <p className="text-sm text-text-tertiary mt-1">{card.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {content.why_choose_us && (
                  <section className="bg-elevated p-4 md:p-8 rounded-xl border border-border">
                    <h2 className="text-lg md:text-lg md:text-2xl font-bold text-text-primary mb-2">{content.why_choose_us.section_heading}</h2>
                    <p className="text-text-tertiary text-sm md:text-base mb-4 md:mb-6">{content.why_choose_us.section_subtext}</p>
                    <div className="space-y-3">
                      {content.why_choose_us.items?.map((item: any, i: number) => (
                        <div key={i} className="flex gap-3 md:gap-4 p-3 md:p-4 bg-app rounded-lg border border-border">
                          <span className="text-lg md:text-xl">{item.icon?.replace('fa ', 'fa-')}</span>
                          <div>
                            <h3 className="font-semibold text-text-primary text-sm md:text-base">{item.title}</h3>
                            <p className="text-xs md:text-sm text-text-tertiary mt-1">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {content.process && (
                  <section className="bg-elevated p-8 rounded-xl border border-border">
                    <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-2">{content.process.section_heading}</h2>
                    <p className="text-text-tertiary mb-6">{content.process.section_subtext}</p>
                    <div className="space-y-4">
                      {content.process.steps?.map((step: any, i: number) => (
                        <div key={i} className="flex gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-accent text-text-primary rounded-full flex items-center justify-center font-bold">{i + 1}</div>
                          <div className="pt-1">
                            <h3 className="font-semibold text-text-primary">{step.title}</h3>
                            <p className="text-sm text-text-tertiary">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {content.faq && (
                  <section className="bg-elevated p-8 rounded-xl border border-border">
                    <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-4">{content.faq.section_heading}</h2>
                    <div className="space-y-4">
                      {content.faq.items?.map((item: any, i: number) => (
                        <div key={i} className="p-4 bg-app rounded-lg border border-border">
                          <h3 className="font-semibold text-text-primary">Q: {item.question}</h3>
                          <p className="text-text-tertiary mt-2">A: {item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {content.local_context && (
                  <section className="bg-elevated p-8 rounded-xl border border-border">
                    <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-4">{content.local_context.section_heading}</h2>
                    <p className="text-text-secondary leading-relaxed">{content.local_context.paragraph_1}</p>
                    <p className="text-text-secondary leading-relaxed mt-4">{content.local_context.paragraph_2}</p>
                  </section>
                )}

                {content.final_cta && (
                  <section className="bg-accent p-8 rounded-xl">
                    <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-2">{content.final_cta.heading}</h2>
                    <p className="text-text-primary/80 mb-4">{content.final_cta.subtext}</p>
                    <div className="flex gap-4 flex-wrap">
                      <button className="px-6 py-3 bg-white text-accent rounded-lg font-medium">{content.final_cta.cta_primary_text}</button>
                      <button className="px-6 py-3 border border-white text-text-primary rounded-lg font-medium">{content.final_cta.cta_secondary_text}</button>
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <h3 className="text-text-primary font-semibold mb-4">Primary Keyword</h3>
                  <input 
                    type="text" 
                    value={primaryKeyword} 
                    readOnly 
                    className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" 
                  />
                </div>

                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <h3 className="text-text-primary font-semibold mb-4">Secondary Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {secondaryKeywords.map((kw: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-app border border-border rounded-lg text-text-secondary text-sm">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <h3 className="text-text-primary font-semibold mb-4">Meta Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs md:text-sm text-text-tertiary mb-1">Page Title</label>
                      <input type="text" value={content.meta?.title || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm text-text-tertiary mb-1">Meta Description</label>
                      <textarea value={content.meta?.description || ''} readOnly className="w-full p-3 border border-border rounded-lg bg-app text-text-primary h-20" />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm text-text-tertiary mb-1">H1</label>
                      <input type="text" value={content.meta?.h1 || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm text-text-tertiary mb-1">Slug</label>
                      <div className="flex">
                        <span className="p-3 bg-gray-700 border border-border border-r-0 rounded-l-lg text-text-disabled">/</span>
                        <input type="text" value={content.meta?.slug || ''} readOnly className="flex-1 p-3 bg-app border border-border rounded-r-lg text-text-primary" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm text-text-tertiary mb-1">Breadcrumb</label>
                      <input type="text" value={content.breadcrumb?.text || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hero' && (
              <div className="space-y-4">
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">H1</label>
                  <input type="text" value={content.hero?.h1 || content.meta?.h1 || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Intro Paragraph</label>
                  <textarea value={content.hero?.intro_paragraph || ''} readOnly className="w-full p-3 border border-border rounded-lg bg-app text-text-primary h-24" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">CTA Primary</label>
                  <input type="text" value={content.hero?.cta_primary_text || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">CTA Secondary</label>
                  <input type="text" value={content.hero?.cta_secondary_text || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Review Line</label>
                  <input type="text" value={content.hero?.review_line || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4">
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Section Heading</label>
                  <input type="text" value={content.about_service?.section_heading || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Subheading</label>
                  <input type="text" value={content.about_service?.subheading || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                </div>
                <div className="bg-elevated p-4 md:p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Paragraph 1 (150-200 words)</label>
                  <textarea value={content.about_service?.paragraph_1 || ''} readOnly className="w-full p-3 border border-border rounded-lg bg-app text-text-primary h-32 md:h-40" />
                </div>
                <div className="bg-elevated p-4 md:p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Paragraph 2 (150-200 words)</label>
                  <textarea value={content.about_service?.paragraph_2 || ''} readOnly className="w-full p-3 border border-border rounded-lg bg-app text-text-primary h-32 md:h-40" />
                </div>
              </div>
            )}

            {activeTab === 'problems' && (
              <div className="space-y-4">
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Section Heading</label>
                  <input type="text" value={content.problems?.section_heading || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Section Subtext</label>
                  <textarea value={content.problems?.section_subtext || ''} readOnly className="w-full p-3 border border-border rounded-lg bg-app text-text-primary h-20" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Problem Cards ({content.problems?.cards?.length || 0})</label>
                  <div className="space-y-3">
                    {content.problems?.cards?.map((card: any, i: number) => (
                      <div key={i} className="p-4 bg-app rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{card.icon?.replace('fa ', 'fa-')}</span>
                          <span className="font-medium text-text-primary">{card.title}</span>
                        </div>
                        <p className="text-sm text-text-tertiary mt-2 ml-8">{card.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'why' && (
              <div className="space-y-4">
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Section Heading</label>
                  <input type="text" value={content.why_choose_us?.section_heading || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Section Subtext</label>
                  <textarea value={content.why_choose_us?.section_subtext || ''} readOnly className="w-full p-3 border border-border rounded-lg bg-app text-text-primary h-20" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Items ({content.why_choose_us?.items?.length || 0})</label>
                  <div className="space-y-3">
                    {content.why_choose_us?.items?.map((item: any, i: number) => (
                      <div key={i} className="p-4 bg-app rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{item.icon?.replace('fa ', 'fa-')}</span>
                          <span className="font-medium text-text-primary">{item.title}</span>
                        </div>
                        <p className="text-sm text-text-tertiary mt-2 ml-8">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'process' && (
              <div className="space-y-4">
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Section Heading</label>
                  <input type="text" value={content.process?.section_heading || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Section Subtext</label>
                  <textarea value={content.process?.section_subtext || ''} readOnly className="w-full p-3 border border-border rounded-lg bg-app text-text-primary h-20" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Steps ({content.process?.steps?.length || 0})</label>
                  <div className="space-y-3">
                    {content.process?.steps?.map((step: any, i: number) => (
                      <div key={i} className="p-4 bg-app rounded-lg border border-border flex gap-4">
                        <span className="flex-shrink-0 w-10 h-10 bg-blue-600 text-text-primary rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                        <div>
                          <span className="font-medium text-text-primary">{step.title}</span>
                          <p className="text-sm text-text-tertiary mt-1">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-4">
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Section Heading</label>
                  <input type="text" value={content.faq?.section_heading || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Questions ({content.faq?.items?.length || 0})</label>
                  <div className="space-y-3">
                    {content.faq?.items?.map((item: any, i: number) => (
                      <div key={i} className="p-4 bg-app rounded-lg border border-border">
                        <div className="font-medium text-text-primary">Q: {item.question}</div>
                        <div className="text-sm text-text-tertiary mt-2">A: {item.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'local' && (
              <div className="space-y-4">
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Section Heading</label>
                  <input type="text" value={content.local_context?.section_heading || ''} readOnly className="w-full p-3 bg-app border border-border rounded-lg text-text-primary" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Paragraph 1</label>
                  <textarea value={content.local_context?.paragraph_1 || ''} readOnly className="w-full p-3 border border-border rounded-lg bg-app text-text-primary h-24" />
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Paragraph 2</label>
                  <textarea value={content.local_context?.paragraph_2 || ''} readOnly className="w-full p-3 border border-border rounded-lg bg-app text-text-primary h-24" />
                </div>
              </div>
            )}

            {activeTab === 'links' && (
              <div className="space-y-4">
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Other Services in City ({content.internal_links?.other_services_in_city?.length || 0})</label>
                  <div className="space-y-2">
                    {content.internal_links?.other_services_in_city?.map((link: any, i: number) => (
                      <div key={i} className="p-3 bg-app rounded-lg border border-border flex justify-between items-center">
                        <span className="text-text-primary">{link.name}</span>
                        <span className="text-sm text-text-disabled">{link.url}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                  <label className="block text-xs md:text-sm text-text-tertiary mb-2">Same Service in Other Cities ({content.internal_links?.same_service_other_cities?.length || 0})</label>
                  <div className="space-y-2">
                    {content.internal_links?.same_service_other_cities?.map((link: any, i: number) => (
                      <div key={i} className="p-3 bg-app rounded-lg border border-border flex justify-between items-center">
                        <span className="text-text-primary">{link.city}</span>
                        <span className="text-sm text-text-disabled">{link.url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schema' && (
              <div className="bg-elevated p-4 md:p-5 rounded-xl border border-border">
                <label className="block text-xs md:text-sm text-text-tertiary mb-2">Schema Markup</label>
                <pre className="p-4 bg-app rounded-lg text-green-400 text-xs overflow-auto max-h-[500px] border border-border">
                  {JSON.stringify(content.schema_markup || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - always visible */}
        <>
          {/* Desktop: bottom left, avoiding sidebar */}
          <div className="fixed bottom-4 left-64 bg-card border border-border rounded-lg p-3 z-40 shadow-xl hidden lg:flex gap-2">
            <button 
              onClick={handleApprove} 
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-text-primary rounded-lg text-sm font-medium"
            >
              ✓ Approve
            </button>
            <button 
              onClick={handleComplete} 
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-text-primary rounded-lg text-sm font-medium"
            >
              ✓ Mark Complete
            </button>
            <button 
              onClick={handleReject} 
              className="px-3 py-2 bg-gray-700 hover:bg-elevated text-text-primary rounded-lg text-sm"
            >
              Reject
            </button>
            <button 
              onClick={() => setShowDelete(true)} 
              className="px-3 py-2 bg-gray-700 hover:bg-gray-700 text-red-400 rounded-lg text-sm"
            >
              🗑
            </button>
          </div>
          {/* Mobile: bottom right */}
          <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-3 z-40 shadow-xl lg:hidden">
            <div className="flex gap-2">
              <button 
                onClick={handleApprove} 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-text-primary rounded-lg text-sm font-medium"
              >
                ✓ Approve
              </button>
              <button 
                onClick={handleComplete} 
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-text-primary rounded-lg text-sm font-medium"
              >
                ✓ Complete
              </button>
              <button 
                onClick={handleReject} 
                className="px-3 py-2 bg-gray-700 hover:bg-elevated text-text-primary rounded-lg text-sm"
              >
                Reject
              </button>
              <button 
                onClick={() => setShowDelete(true)} 
                className="px-3 py-2 bg-gray-700 hover:bg-gray-700 text-red-400 rounded-lg text-sm"
              >
                🗑
              </button>
            </div>
          </div>
        </>

        {/* Delete Modal */}
        {showDelete && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl p-6 max-w-sm w-full mx-4 border border-border">
              <h3 className="text-lg font-medium text-text-primary mb-2">Delete Draft?</h3>
              <p className="text-text-tertiary mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={handleDelete} 
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-text-primary rounded-lg"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setShowDelete(false)} 
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-elevated text-text-primary rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}