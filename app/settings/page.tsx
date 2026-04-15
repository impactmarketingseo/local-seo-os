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

interface ApiKey {
  id: string;
  key_name: string;
  provider: string;
  description: string;
}

interface QARule {
  id: string;
  rule_type: string;
  threshold: number;
  enabled: boolean;
}

const tabs = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'api-keys', label: 'API Keys', icon: 'key' },
  { id: 'templates', label: 'Templates', icon: 'document' },
  { id: 'qa-rules', label: 'QA Rules', icon: 'check-circle' },
  { id: 'export', label: 'Export', icon: 'download' },
];

function TabIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, JSX.Element> = {
    settings: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
    key: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />,
    document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    'check-circle': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    download: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
  };
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {icons[name]}
    </svg>
  );
}

function GeneralTab() {
  const [agencyName, setAgencyName] = useState('Impact Marketing');
  const [timezone, setTimezone] = useState('America/New_York');
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">General Settings</h2>
        <p className="text-sm text-text-tertiary">Configure your agency basics</p>
      </div>
      
      <div className="space-y-4 max-w-md">
        <div>
          <label className="input-label">Agency Name</label>
          <input
            type="text"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            className="input-field"
          />
        </div>
        
        <div>
          <label className="input-label">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="input-field"
          >
            <option value="America/New_York">Eastern (ET)</option>
            <option value="America/Chicago">Central (CT)</option>
            <option value="America/Denver">Mountain (MT)</option>
            <option value="America/Los_Angeles">Pacific (PT)</option>
          </select>
        </div>

        <div className="pt-4">
          <button onClick={save} className="btn-primary">
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApiKeysTab() {
  const [keys] = useState<ApiKey[]>([
    { id: '1', key_name: 'groq', provider: 'Groq', description: 'Free AI API for content generation' },
    { id: '2', key_name: 'wordpress', provider: 'WordPress', description: 'Per-client WordPress REST API' },
    { id: '3', key_name: 'google_search_console', provider: 'Google', description: 'Google Search Console API' },
    { id: '4', key_name: 'google_business', provider: 'Google', description: 'Google Business Profile API' },
  ]);
  const [testStatus, setTestStatus] = useState<Record<string, string>>({});

  const testConnection = async (keyName: string) => {
    setTestStatus({ ...testStatus, [keyName]: 'testing' });
    await new Promise(r => setTimeout(r, 1000));
    setTestStatus({ ...testStatus, [keyName]: keyName === 'groq' ? 'connected' : 'not_configured' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">API Keys</h2>
        <p className="text-sm text-text-tertiary">Manage your connected services</p>
      </div>
      
      <div className="space-y-3">
        {keys.map((key) => (
          <div key={key.id} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
            <div>
              <p className="font-medium text-text-primary">{key.provider}</p>
              <p className="text-sm text-text-tertiary">{key.description}</p>
            </div>
            <button
              onClick={() => testConnection(key.key_name)}
              disabled={testStatus[key.key_name] === 'testing'}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                testStatus[key.key_name] === 'connected' 
                  ? 'bg-success/10 text-success' 
                  : testStatus[key.key_name] === 'not_configured'
                  ? 'bg-error/10 text-error'
                  : 'btn-primary'
              }`}
            >
              {testStatus[key.key_name] === 'testing' ? 'Testing...' : 
               testStatus[key.key_name] === 'connected' ? 'Connected' : 
               testStatus[key.key_name] === 'not_configured' ? 'Not Configured' : 'Test Connection'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplatesTab() {
  const [prompts, setPrompts] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrompts() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.from('prompt_versions').select('*').order('created_at', { ascending: false });
      if (data) setPrompts(data);
      setLoading(false);
    }
    loadPrompts();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Prompt Templates</h2>
        <p className="text-sm text-text-tertiary">View and edit your content generation prompts</p>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <div className="rounded-lg bg-card border border-border p-8 text-center">
          <p className="text-text-tertiary">No prompt templates configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-text-primary">{prompt.name}</h3>
                    {prompt.active && (
                      <span className="rounded-full px-2 py-0.5 text-xs bg-success/10 text-success">Active</span>
                    )}
                  </div>
                  <p className="text-sm text-text-tertiary">Version {prompt.version_label}</p>
                </div>
                <button className="btn-secondary text-sm">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QARulesTab() {
  const [rules, setRules] = useState<QARule[]>([
    { id: '1', rule_type: 'min_word_count', threshold: 1800, enabled: true },
    { id: '2', rule_type: 'uniqueness_threshold', threshold: 85, enabled: true },
    { id: '3', rule_type: 'keyword_in_h1', threshold: 1, enabled: true },
    { id: '4', rule_type: 'banned_words_check', threshold: 0, enabled: true },
  ]);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">QA Rules</h2>
        <p className="text-sm text-text-tertiary">Configure quality assurance checks</p>
      </div>
      
      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
            <div>
              <p className="font-medium text-text-primary capitalize">{rule.rule_type.replace(/_/g, ' ')}</p>
              <p className="text-sm text-text-tertiary">
                {rule.rule_type === 'min_word_count' && 'Minimum word count per page'}
                {rule.rule_type === 'uniqueness_threshold' && 'Minimum uniqueness score %'}
                {rule.rule_type === 'keyword_in_h1' && 'Primary keyword must be in H1'}
                {rule.rule_type === 'banned_words_check' && 'Check for banned words'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() => toggleRule(rule.id)}
                className="w-5 h-5 rounded accent-accent"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportTab() {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportData = async (type: string) => {
    setExporting(type);
    await new Promise(r => setTimeout(r, 1000));
    setExporting(null);
  };

  const exportOptions = [
    { id: 'clients', label: 'Client Data', description: 'Export all clients as CSV', icon: 'users' },
    { id: 'deliverables', label: 'Deliverables', description: 'Export all content as DOCX', icon: 'document' },
    { id: 'performance', label: 'Performance Reports', description: 'Export analytics as CSV', icon: 'chart' },
    { id: 'queue', label: 'Queue History', description: 'Export queue as CSV', icon: 'layers' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Export Data</h2>
        <p className="text-sm text-text-tertiary">Download your data in various formats</p>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2">
        {exportOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => exportData(option.id)}
            disabled={exporting === option.id}
            className="flex items-center justify-start gap-3 p-4 rounded-lg bg-card border border-border text-left hover:border-accent/30 transition-colors"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <TabIcon name={option.icon} className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-text-primary">{option.label}</p>
              <p className="text-sm text-text-tertiary">{option.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="text-text-tertiary mt-1">Configure your content operating system</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-accent text-white' 
                : 'bg-input text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <TabIcon name={tab.icon} className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card-standard">
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'api-keys' && <ApiKeysTab />}
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'qa-rules' && <QARulesTab />}
        {activeTab === 'export' && <ExportTab />}
      </div>
    </div>
  );
}