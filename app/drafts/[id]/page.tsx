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

  return (
    <div className="p-6">
      <button onClick={() => router.back()} className="mb-4 text-blue-600">← Back</button>
      <h1 className="text-2xl font-bold">{String(draft?.title || 'Untitled')}</h1>
      <p className="mt-2">Status: {String(draft?.status ?? 'unknown')}</p>
      <p className="mt-1">Client ID: {String(draft?.client_id ?? 'Unknown')}</p>
      <details className="mt-4">
        <summary className="cursor-pointer text-blue-600">View Raw Data</summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-[600px]">
          {JSON.stringify(draft, null, 2)}
        </pre>
      </details>
    </div>
  );
}