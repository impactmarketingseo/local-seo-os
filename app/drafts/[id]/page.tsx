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
  const [activeTab, setActiveTab] = useState<string>('seo');

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
    draft: { bg: 'bg-warning/10', text: 'text-warning' },
    review: { bg: 'bg-info/10', text: 'text-info' },
    approved: { bg: 'bg-success/10', text: 'text-success' },
    rejected: { bg: 'bg-error/10', text: 'text-error' },
  };
  const statusKey = String(draft?.status || 'draft');
  const status = statusColors[statusKey] || statusColors.draft;

  return (
    <div className="p-6">
      <button onClick={() => router.back()} className="mb-4 text-blue-600">← Back</button>
      <h1 className="text-2xl font-bold">{String(title)}</h1>
      <p className="mt-2">Status: {String(draft?.status ?? 'unknown')}</p>
      
      <div className="mt-4 flex gap-3">
        <span className={`px-3 py-1.5 rounded-md text-sm font-medium ${status.bg} ${status.text}`}>
          {String(draft?.status)}
        </span>
      </div>

      <div className="mt-6 border-b border-gray-300">
        <div className="flex gap-4">
          {['seo', 'hero', 'meta', 'problems', 'why', 'process', 'faq', 'local', 'links', 'schema'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'seo' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">SEO</h2>
            <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-[400px]">
              {JSON.stringify(content.meta || {}, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'hero' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Hero</h2>
            <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-[400px]">
              {JSON.stringify(content.hero || {}, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'meta' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Meta</h2>
            <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-[400px]">
              {JSON.stringify(content.meta || {}, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'problems' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Problems</h2>
            <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-[400px]">
              {JSON.stringify(content.problems || {}, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'why' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Why Choose Us</h2>
            <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-[400px]">
              {JSON.stringify(content.why_choose_us || {}, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'process' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Process</h2>
            <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-[400px]">
              {JSON.stringify(content.process || {}, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'faq' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">FAQ</h2>
            <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-[400px]">
              {JSON.stringify(content.faq || {}, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'local' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Local Context</h2>
            <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-[400px]">
              {JSON.stringify(content.local_context || {}, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'links' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Internal Links</h2>
            <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-[400px]">
              {JSON.stringify(content.internal_links || {}, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'schema' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Schema</h2>
            <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-[400px]">
              {JSON.stringify(content.schema_markup || {}, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <details className="mt-8">
        <summary className="cursor-pointer text-blue-600">View Raw Data</summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-[600px]">
          {JSON.stringify(draft, null, 2)}
        </pre>
      </details>
    </div>
  );
}