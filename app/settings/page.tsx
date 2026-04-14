'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface PromptVersion {
  id: string;
  name: string;
  version_label: string;
  active: boolean;
  prompt_text: string;
  created_at: string;
}

export default function SettingsPage() {
  const [prompts, setPrompts] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'prompts' | 'notifications' | 'schedule'>('prompts');

  useEffect(() => {
    async function loadSettings() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.from('prompt_versions').select('*').order('created_at', { ascending: false });
      if (data) setPrompts(data);
      setLoading(false);
    }
    loadSettings();
  }, []);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="mb-4 flex gap-2 border-b">
        {(['prompts', 'notifications', 'schedule'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-primary -mb-px text-primary'
                : 'text-muted-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'prompts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Prompt Versions</h2>
          </div>
          
          {prompts.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-muted-foreground">No prompt versions configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prompts.map((prompt) => (
                <div key={prompt.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{prompt.name}</h3>
                      <p className="text-sm text-muted-foreground">Version: {prompt.version_label}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      prompt.active ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                    }`}>
                      {prompt.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Notification Settings</h2>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Configure email and in-app notifications for drafts ready for review and published content.
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span>Email when drafts are ready for review</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span>Email when content is published</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span>In-app notifications</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Weekly Generation Schedule</h2>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Configure automatic weekly content generation. Currently runs every Monday at 6:00 AM.
            </p>
            <div className="mt-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span>Enable weekly auto-generation</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}