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

  if (loading) return <div className="p-6">Loading...</div>;
  if (!draft) return <div className="p-6">Draft not found</div>;

  const content = draft.content_json || {};
  const title = draft.title || content.meta?.h1 || content.meta?.title || 'Untitled';
  
  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    review: { bg: 'bg-blue-100', text: 'text-blue-800' },
    approved: { bg: 'bg-green-100', text: 'text-green-800' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  };
  const statusKey = String(draft?.status || 'draft');
  const status = statusColors[statusKey] || statusColors.draft;

  const renderSection = (heading: string, content: any) => {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{heading}</h2>
        {typeof content === 'string' && <p className="text-gray-700 leading-relaxed">{content}</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={() => router.back()} className="mb-4 text-blue-600 hover:underline">← Back to Drafts</button>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{String(title)}</h1>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                {String(draft?.status)}
              </span>
            </div>
          </div>
          <p className="text-gray-600">{content.meta?.description}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              {['preview', 'seo', 'hero', 'problems', 'why', 'process', 'faq', 'local', 'links', 'schema'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 capitalize ${
                    activeTab === tab 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
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
                  <section>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{content.hero.h1 || title}</h1>
                    <p className="text-xl text-gray-600 mb-6">{content.hero.intro_paragraph}</p>
                    <div className="flex gap-4">
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">{content.hero.cta_primary_text || 'Get Started'}</button>
                      <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium">{content.hero.cta_secondary_text || 'Learn More'}</button>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">{content.hero.review_line}</p>
                    <div className="flex gap-4 mt-4">
                      {content.hero.trust_badges?.map((badge: string, i: number) => (
                        <span key={i} className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">{badge}</span>
                      ))}
                    </div>
                  </section>
                )}

                {content.trust_strip && (
                  <section className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex flex-wrap gap-4">
                      {content.trust_strip.map((item: string, i: number) => (
                        <span key={i} className="text-sm text-gray-700">✓ {item}</span>
                      ))}
                    </div>
                  </section>
                )}

                {content.problems && (
                  <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.problems.section_heading}</h2>
                    <p className="text-gray-600 mb-6">{content.problems.section_subtext}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {content.problems.cards?.map((card: any, i: number) => (
                        <div key={i} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{card.icon?.replace('fa ', 'fa-')}</span>
                            <div>
                              <h3 className="font-semibold text-gray-900">{card.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {content.why_choose_us && (
                  <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.why_choose_us.section_heading}</h2>
                    <p className="text-gray-600 mb-6">{content.why_choose_us.section_subtext}</p>
                    <div className="space-y-4">
                      {content.why_choose_us.items?.map((item: any, i: number) => (
                        <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                          <span className="text-2xl">{item.icon?.replace('fa ', 'fa-')}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {content.process && (
                  <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.process.section_heading}</h2>
                    <p className="text-gray-600 mb-6">{content.process.section_subtext}</p>
                    <div className="space-y-4">
                      {content.process.steps?.map((step: any, i: number) => (
                        <div key={i} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">{i + 1}</div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{step.title}</h3>
                            <p className="text-sm text-gray-600">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {content.faq && (
                  <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.faq.section_heading}</h2>
                    <div className="space-y-4">
                      {content.faq.items?.map((item: any, i: number) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg">
                          <h3 className="font-semibold text-gray-900">Q: {item.question}</h3>
                          <p className="text-gray-600 mt-2">A: {item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {content.local_context && (
                  <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.local_context.section_heading}</h2>
                    <p className="text-gray-700 leading-relaxed">{content.local_context.paragraph_1}</p>
                    <p className="text-gray-700 leading-relaxed mt-4">{content.local_context.paragraph_2}</p>
                  </section>
                )}

                {content.final_cta && (
                  <section className="bg-blue-600 text-white p-8 rounded-lg">
                    <h2 className="text-2xl font-bold mb-2">{content.final_cta.heading}</h2>
                    <p className="text-blue-100 mb-4">{content.final_cta.subtext}</p>
                    <div className="flex gap-4">
                      <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium">{content.final_cta.cta_primary_text}</button>
                      <button className="px-6 py-3 border border-white text-white rounded-lg font-medium">{content.final_cta.cta_secondary_text}</button>
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                  <input type="text" value={content.meta?.title || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                  <textarea value={content.meta?.description || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50 h-24" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">H1</label>
                  <input type="text" value={content.meta?.h1 || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input type="text" value={content.meta?.slug || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Breadcrumb</label>
                  <input type="text" value={content.breadcrumb?.text || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
              </div>
            )}

            {activeTab === 'hero' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">H1</label>
                  <input type="text" value={content.hero?.h1 || content.meta?.h1 || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Intro Paragraph</label>
                  <textarea value={content.hero?.intro_paragraph || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50 h-24" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CTA Primary</label>
                  <input type="text" value={content.hero?.cta_primary_text || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CTA Secondary</label>
                  <input type="text" value={content.hero?.cta_secondary_text || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Line</label>
                  <input type="text" value={content.hero?.review_line || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
              </div>
            )}

            {activeTab === 'problems' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Heading</label>
                  <input type="text" value={content.problems?.section_heading || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Subtext</label>
                  <textarea value={content.problems?.section_subtext || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50 h-20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Problem Cards ({content.problems?.cards?.length || 0})</label>
                  {content.problems?.cards?.map((card: any, i: number) => (
                    <div key={i} className="p-4 bg-gray-50 rounded mb-2">
                      <div className="font-medium">{card.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{card.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'why' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Heading</label>
                  <input type="text" value={content.why_choose_us?.section_heading || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Subtext</label>
                  <textarea value={content.why_choose_us?.section_subtext || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50 h-20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Items ({content.why_choose_us?.items?.length || 0})</label>
                  {content.why_choose_us?.items?.map((item: any, i: number) => (
                    <div key={i} className="p-4 bg-gray-50 rounded mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.icon?.replace('fa ', 'fa-')}</span>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'process' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Heading</label>
                  <input type="text" value={content.process?.section_heading || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Subtext</label>
                  <textarea value={content.process?.section_subtext || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50 h-20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Steps ({content.process?.steps?.length || 0})</label>
                  {content.process?.steps?.map((step: any, i: number) => (
                    <div key={i} className="p-4 bg-gray-50 rounded mb-2 flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                      <div>
                        <div className="font-medium">{step.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Heading</label>
                  <input type="text" value={content.faq?.section_heading || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Questions ({content.faq?.items?.length || 0})</label>
                  {content.faq?.items?.map((item: any, i: number) => (
                    <div key={i} className="p-4 bg-gray-50 rounded mb-2">
                      <div className="font-medium">Q: {item.question}</div>
                      <div className="text-sm text-gray-600 mt-1">A: {item.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'local' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Heading</label>
                  <input type="text" value={content.local_context?.section_heading || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paragraph 1</label>
                  <textarea value={content.local_context?.paragraph_1 || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50 h-24" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paragraph 2</label>
                  <textarea value={content.local_context?.paragraph_2 || ''} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-50 h-24" />
                </div>
              </div>
            )}

            {activeTab === 'links' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Other Services in City ({content.internal_links?.other_services_in_city?.length || 0})</label>
                  {content.internal_links?.other_services_in_city?.map((link: any, i: number) => (
                    <div key={i} className="p-3 bg-gray-50 rounded mb-2 flex justify-between">
                      <span>{link.name}</span>
                      <span className="text-sm text-gray-500">{link.url}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Same Service in Other Cities ({content.internal_links?.same_service_other_cities?.length || 0})</label>
                  {content.internal_links?.same_service_other_cities?.map((link: any, i: number) => (
                    <div key={i} className="p-3 bg-gray-50 rounded mb-2 flex justify-between">
                      <span>{link.city}</span>
                      <span className="text-sm text-gray-500">{link.url}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'schema' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schema Markup</label>
                <pre className="p-4 bg-gray-900 text-green-400 rounded text-xs overflow-auto max-h-[500px]">
                  {JSON.stringify(content.schema_markup || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}