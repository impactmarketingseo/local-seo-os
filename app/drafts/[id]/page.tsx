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
      alert('No queue item found for this draft');
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
        const supabase = createSupabaseBrowserClient();
        await supabase.from('drafts').delete().eq('id', draftId);
        if (result.draft_id) {
          router.push('/drafts/' + result.draft_id);
        } else {
          router.refresh();
        }
      } else {
        alert(result.error || 'Regeneration failed');
      }
    } catch (e) {
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
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>
  );
  if (!draft) return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
      <div className="text-white">Draft not found</div>
    </div>
  );

  const content = draft.content_json || {};
  const title = draft.title || content.meta?.h1 || content.meta?.title || 'Untitled';
  
  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
    review: { bg: 'bg-blue-900/30', text: 'text-blue-400' },
    approved: { bg: 'bg-green-900/30', text: 'text-green-400' },
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
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="max-w-5xl mx-auto p-6">
        <button onClick={() => router.back()} className="mb-6 text-blue-400 hover:text-blue-300">← Back to Drafts</button>
        
        <div className="bg-[#111827] rounded-xl p-6 mb-6 border border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">{String(title)}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                    {String(draft?.status)}
                  </span>
                  <span className="text-gray-400 text-sm">{wordCount} words</span>
                  <span className="text-gray-500 text-sm">v{draft?.version_number || 1}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleRegenerate} 
                disabled={regenerating}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
              >
                {regenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button 
                onClick={handleExport}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
              >
                Export
              </button>
            </div>
          </div>
          <p className="text-gray-400">{content.meta?.description}</p>
        </div>

        <div className="bg-[#111827] rounded-xl border border-gray-800 mb-6">
          <div className="border-b border-gray-800">
            <div className="flex overflow-x-auto">
              {['preview', 'seo', 'hero', 'about', 'problems', 'why', 'process', 'faq', 'local', 'links', 'schema'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-4 text-sm font-medium border-b-2 capitalize whitespace-nowrap ${
                    activeTab === tab 
                      ? 'border-blue-500 text-blue-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
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
                  <section className="bg-[#1a2234] p-8 rounded-xl border border-gray-800">
                    <h1 className="text-4xl font-bold text-white mb-4">{content.hero.h1 || title}</h1>
                    <p className="text-xl text-gray-300 mb-6">{content.hero.intro_paragraph}</p>
                    <div className="flex gap-4 flex-wrap">
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">{content.hero.cta_primary_text || 'Get Started'}</button>
                      <button className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800">{content.hero.cta_secondary_text || 'Learn More'}</button>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">{content.hero.review_line}</p>
                    <div className="flex gap-3 mt-4 flex-wrap">
                      {content.hero.trust_badges?.map((badge: string, i: number) => (
                        <span key={i} className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded border border-gray-700">{badge}</span>
                      ))}
                    </div>
                  </section>
                )}

                {content.trust_strip && (
                  <section className="bg-[#1a2234] p-6 rounded-xl border border-gray-800">
                    <div className="flex flex-wrap gap-6">
                      {content.trust_strip.map((item: string, i: number) => (
                        <span key={i} className="text-sm text-gray-300">✓ {item}</span>
                      ))}
                    </div>
                  </section>
                )}

                {content.about_service && (
                  <section className="bg-[#1a2234] p-8 rounded-xl border border-gray-800">
                    <h2 className="text-2xl font-bold text-white mb-2">{content.about_service.section_heading}</h2>
                    <p className="text-lg text-blue-400 mb-4">{content.about_service.subheading}</p>
                    <p className="text-gray-300 leading-relaxed mb-4">{content.about_service.paragraph_1}</p>
                    <p className="text-gray-300 leading-relaxed">{content.about_service.paragraph_2}</p>
                  </section>
                )}

                {content.problems && (
                  <section className="bg-[#1a2234] p-8 rounded-xl border border-gray-800">
                    <h2 className="text-2xl font-bold text-white mb-2">{content.problems.section_heading}</h2>
                    <p className="text-gray-400 mb-6">{content.problems.section_subtext}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {content.problems.cards?.map((card: any, i: number) => (
                        <div key={i} className="p-4 bg-[#0a0f1a] border border-gray-700 rounded-lg">
                          <div className="flex items-start gap-3">
                            <span className="text-xl">{card.icon?.replace('fa ', 'fa-')}</span>
                            <div>
                              <h3 className="font-semibold text-white">{card.title}</h3>
                              <p className="text-sm text-gray-400 mt-1">{card.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {content.why_choose_us && (
                  <section className="bg-[#1a2234] p-8 rounded-xl border border-gray-800">
                    <h2 className="text-2xl font-bold text-white mb-2">{content.why_choose_us.section_heading}</h2>
                    <p className="text-gray-400 mb-6">{content.why_choose_us.section_subtext}</p>
                    <div className="space-y-3">
                      {content.why_choose_us.items?.map((item: any, i: number) => (
                        <div key={i} className="flex gap-4 p-4 bg-[#0a0f1a] rounded-lg border border-gray-700">
                          <span className="text-xl">{item.icon?.replace('fa ', 'fa-')}</span>
                          <div>
                            <h3 className="font-semibold text-white">{item.title}</h3>
                            <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {content.process && (
                  <section className="bg-[#1a2234] p-8 rounded-xl border border-gray-800">
                    <h2 className="text-2xl font-bold text-white mb-2">{content.process.section_heading}</h2>
                    <p className="text-gray-400 mb-6">{content.process.section_subtext}</p>
                    <div className="space-y-4">
                      {content.process.steps?.map((step: any, i: number) => (
                        <div key={i} className="flex gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">{i + 1}</div>
                          <div className="pt-1">
                            <h3 className="font-semibold text-white">{step.title}</h3>
                            <p className="text-sm text-gray-400">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {content.faq && (
                  <section className="bg-[#1a2234] p-8 rounded-xl border border-gray-800">
                    <h2 className="text-2xl font-bold text-white mb-4">{content.faq.section_heading}</h2>
                    <div className="space-y-4">
                      {content.faq.items?.map((item: any, i: number) => (
                        <div key={i} className="p-4 bg-[#0a0f1a] rounded-lg border border-gray-700">
                          <h3 className="font-semibold text-white">Q: {item.question}</h3>
                          <p className="text-gray-400 mt-2">A: {item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {content.local_context && (
                  <section className="bg-[#1a2234] p-8 rounded-xl border border-gray-800">
                    <h2 className="text-2xl font-bold text-white mb-4">{content.local_context.section_heading}</h2>
                    <p className="text-gray-300 leading-relaxed">{content.local_context.paragraph_1}</p>
                    <p className="text-gray-300 leading-relaxed mt-4">{content.local_context.paragraph_2}</p>
                  </section>
                )}

                {content.final_cta && (
                  <section className="bg-blue-600 p-8 rounded-xl">
                    <h2 className="text-2xl font-bold text-white mb-2">{content.final_cta.heading}</h2>
                    <p className="text-blue-100 mb-4">{content.final_cta.subtext}</p>
                    <div className="flex gap-4 flex-wrap">
                      <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium">{content.final_cta.cta_primary_text}</button>
                      <button className="px-6 py-3 border border-white text-white rounded-lg font-medium">{content.final_cta.cta_secondary_text}</button>
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <h3 className="text-white font-semibold mb-4">Primary Keyword</h3>
                  <input 
                    type="text" 
                    value={primaryKeyword} 
                    readOnly 
                    className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" 
                  />
                </div>

                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <h3 className="text-white font-semibold mb-4">Secondary Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {secondaryKeywords.map((kw: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-[#0a0f1a] border border-gray-700 rounded-lg text-gray-300 text-sm">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <h3 className="text-white font-semibold mb-4">Meta Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Page Title</label>
                      <input type="text" value={content.meta?.title || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Meta Description</label>
                      <textarea value={content.meta?.description || ''} readOnly className="w-full p-3 border border-gray-700 rounded-lg bg-[#0a0f1a] text-white h-20" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">H1</label>
                      <input type="text" value={content.meta?.h1 || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Slug</label>
                      <div className="flex">
                        <span className="p-3 bg-gray-800 border border-gray-700 border-r-0 rounded-l-lg text-gray-500">/</span>
                        <input type="text" value={content.meta?.slug || ''} readOnly className="flex-1 p-3 bg-[#0a0f1a] border border-gray-700 rounded-r-lg text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Breadcrumb</label>
                      <input type="text" value={content.breadcrumb?.text || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hero' && (
              <div className="space-y-4">
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">H1</label>
                  <input type="text" value={content.hero?.h1 || content.meta?.h1 || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Intro Paragraph</label>
                  <textarea value={content.hero?.intro_paragraph || ''} readOnly className="w-full p-3 border border-gray-700 rounded-lg bg-[#0a0f1a] text-white h-24" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">CTA Primary</label>
                  <input type="text" value={content.hero?.cta_primary_text || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">CTA Secondary</label>
                  <input type="text" value={content.hero?.cta_secondary_text || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Review Line</label>
                  <input type="text" value={content.hero?.review_line || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4">
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Section Heading</label>
                  <input type="text" value={content.about_service?.section_heading || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Subheading</label>
                  <input type="text" value={content.about_service?.subheading || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Paragraph 1 (150-200 words)</label>
                  <textarea value={content.about_service?.paragraph_1 || ''} readOnly className="w-full p-3 border border-gray-700 rounded-lg bg-[#0a0f1a] text-white h-40" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Paragraph 2 (150-200 words)</label>
                  <textarea value={content.about_service?.paragraph_2 || ''} readOnly className="w-full p-3 border border-gray-700 rounded-lg bg-[#0a0f1a] text-white h-40" />
                </div>
              </div>
            )}

            {activeTab === 'problems' && (
              <div className="space-y-4">
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Section Heading</label>
                  <input type="text" value={content.problems?.section_heading || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Section Subtext</label>
                  <textarea value={content.problems?.section_subtext || ''} readOnly className="w-full p-3 border border-gray-700 rounded-lg bg-[#0a0f1a] text-white h-20" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Problem Cards ({content.problems?.cards?.length || 0})</label>
                  <div className="space-y-3">
                    {content.problems?.cards?.map((card: any, i: number) => (
                      <div key={i} className="p-4 bg-[#0a0f1a] rounded-lg border border-gray-700">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{card.icon?.replace('fa ', 'fa-')}</span>
                          <span className="font-medium text-white">{card.title}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 ml-8">{card.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'why' && (
              <div className="space-y-4">
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Section Heading</label>
                  <input type="text" value={content.why_choose_us?.section_heading || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Section Subtext</label>
                  <textarea value={content.why_choose_us?.section_subtext || ''} readOnly className="w-full p-3 border border-gray-700 rounded-lg bg-[#0a0f1a] text-white h-20" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Items ({content.why_choose_us?.items?.length || 0})</label>
                  <div className="space-y-3">
                    {content.why_choose_us?.items?.map((item: any, i: number) => (
                      <div key={i} className="p-4 bg-[#0a0f1a] rounded-lg border border-gray-700">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{item.icon?.replace('fa ', 'fa-')}</span>
                          <span className="font-medium text-white">{item.title}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 ml-8">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'process' && (
              <div className="space-y-4">
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Section Heading</label>
                  <input type="text" value={content.process?.section_heading || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Section Subtext</label>
                  <textarea value={content.process?.section_subtext || ''} readOnly className="w-full p-3 border border-gray-700 rounded-lg bg-[#0a0f1a] text-white h-20" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Steps ({content.process?.steps?.length || 0})</label>
                  <div className="space-y-3">
                    {content.process?.steps?.map((step: any, i: number) => (
                      <div key={i} className="p-4 bg-[#0a0f1a] rounded-lg border border-gray-700 flex gap-4">
                        <span className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                        <div>
                          <span className="font-medium text-white">{step.title}</span>
                          <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-4">
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Section Heading</label>
                  <input type="text" value={content.faq?.section_heading || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Questions ({content.faq?.items?.length || 0})</label>
                  <div className="space-y-3">
                    {content.faq?.items?.map((item: any, i: number) => (
                      <div key={i} className="p-4 bg-[#0a0f1a] rounded-lg border border-gray-700">
                        <div className="font-medium text-white">Q: {item.question}</div>
                        <div className="text-sm text-gray-400 mt-2">A: {item.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'local' && (
              <div className="space-y-4">
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Section Heading</label>
                  <input type="text" value={content.local_context?.section_heading || ''} readOnly className="w-full p-3 bg-[#0a0f1a] border border-gray-700 rounded-lg text-white" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Paragraph 1</label>
                  <textarea value={content.local_context?.paragraph_1 || ''} readOnly className="w-full p-3 border border-gray-700 rounded-lg bg-[#0a0f1a] text-white h-24" />
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Paragraph 2</label>
                  <textarea value={content.local_context?.paragraph_2 || ''} readOnly className="w-full p-3 border border-gray-700 rounded-lg bg-[#0a0f1a] text-white h-24" />
                </div>
              </div>
            )}

            {activeTab === 'links' && (
              <div className="space-y-4">
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Other Services in City ({content.internal_links?.other_services_in_city?.length || 0})</label>
                  <div className="space-y-2">
                    {content.internal_links?.other_services_in_city?.map((link: any, i: number) => (
                      <div key={i} className="p-3 bg-[#0a0f1a] rounded-lg border border-gray-700 flex justify-between items-center">
                        <span className="text-white">{link.name}</span>
                        <span className="text-sm text-gray-500">{link.url}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                  <label className="block text-sm text-gray-400 mb-2">Same Service in Other Cities ({content.internal_links?.same_service_other_cities?.length || 0})</label>
                  <div className="space-y-2">
                    {content.internal_links?.same_service_other_cities?.map((link: any, i: number) => (
                      <div key={i} className="p-3 bg-[#0a0f1a] rounded-lg border border-gray-700 flex justify-between items-center">
                        <span className="text-white">{link.city}</span>
                        <span className="text-sm text-gray-500">{link.url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schema' && (
              <div className="bg-[#1a2234] p-5 rounded-xl border border-gray-800">
                <label className="block text-sm text-gray-400 mb-2">Schema Markup</label>
                <pre className="p-4 bg-[#0a0f1a] rounded-lg text-green-400 text-xs overflow-auto max-h-[500px] border border-gray-700">
                  {JSON.stringify(content.schema_markup || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {String(draft?.status) !== 'approved' && String(draft?.status) !== 'published' && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-gray-800 p-4">
            <div className="max-w-5xl mx-auto flex justify-end gap-3">
              <button 
                onClick={handleReject} 
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Reject
              </button>
              <button 
                onClick={() => setShowDelete(true)} 
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-red-400 rounded-lg"
              >
                🗑
              </button>
              <button 
                onClick={handleApprove} 
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                ✓ Approve
              </button>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDelete && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#111827] rounded-xl p-6 max-w-sm w-full mx-4 border border-gray-800">
              <h3 className="text-lg font-medium text-white mb-2">Delete Draft?</h3>
              <p className="text-gray-400 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={handleDelete} 
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setShowDelete(false)} 
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
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