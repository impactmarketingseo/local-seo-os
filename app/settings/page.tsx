'use client';

import { useEffect, useState, type ReactNode } from 'react';
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
  { id: 'branding', label: 'Branding', icon: 'palette' },
  { id: 'api-keys', label: 'API Keys', icon: 'key' },
  { id: 'templates', label: 'Templates', icon: 'document' },
  { id: 'qa-rules', label: 'QA Rules', icon: 'check-circle' },
  { id: 'export', label: 'Export', icon: 'download' },
];

function TabIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, ReactNode> = {
    settings: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
    palette: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />,
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

function BrandingTab() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [appName, setAppName] = useState('SEO OS');
  const [accentColor, setAccentColor] = useState('#3B82F6');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.branding) {
        setAppName(data.branding.app_name || 'SEO OS');
        setAccentColor(data.branding.accent_color || '#3B82F6');
        setLogoPreview(data.branding.logo_url || null);
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const save = async () => {
    setSaved(true);
    
    // Save to database
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'branding',
        value: {
          logo_url: logoPreview,
          app_name: appName,
          accent_color: accentColor,
        },
      }),
    });

    // Apply CSS variables immediately
    document.documentElement.style.setProperty('--app-accent', accentColor);
    document.documentElement.style.setProperty('--primary', accentColor);
    document.documentElement.style.setProperty('--ring', accentColor);
    document.documentElement.style.setProperty('--accent', accentColor);
    
    // Trigger a custom event that the settings context can listen to
    window.dispatchEvent(new CustomEvent('settings-updated', { 
      detail: { branding: { logo_url: logoPreview, app_name: appName, accent_color: accentColor } } 
    }));

    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return <div className="skeleton h-40 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Branding</h2>
        <p className="text-sm text-text-tertiary">Customize your logo and colors</p>
      </div>
      
      <div className="space-y-6 max-w-md">
        <div>
          <label className="input-label">Logo</label>
          <div className="mt-2 flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-input flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <label className="btn-secondary cursor-pointer">
              Upload Logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-text-disabled mt-2">Recommended: Square image, PNG or SVG</p>
        </div>

        <div>
          <label className="input-label">App Name</label>
          <input 
            type="text" 
            value={appName} 
            onChange={(e) => setAppName(e.target.value)}
            className="input-field" 
          />
        </div>

        <div>
          <label className="input-label">Accent Color</label>
          <div className="flex items-center gap-3 mt-2">
            <input 
              type="color" 
              value={accentColor} 
              onChange={(e) => setAccentColor(e.target.value)} 
              className="w-10 h-10 rounded cursor-pointer" 
            />
            <span className="text-sm text-text-tertiary mono">{accentColor}</span>
          </div>
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

// Helper to adjust color brightness
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function ApiKeysTab() {
  // API keys are stored locally in browser for convenience
  const [keys, setKeys] = useState<ApiKey[]>([
    { id: '1', key_name: 'groq', provider: 'Groq', description: 'Free AI API - get key at console.groq.com' },
    { id: '2', key_name: 'gemini', provider: 'Google Gemini', description: 'Free AI backup - get key at aistudio.google.com' },
    { id: '3', key_name: 'wordpress', provider: 'WordPress', description: 'Per-client WordPress REST API' },
  ]);
  const [testStatus, setTestStatus] = useState<Record<string, string>>({});
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored: Record<string, string> = {};
    keys.forEach(k => {
      const val = localStorage.getItem(`api_key_${k.key_name}`);
      if (val) stored[k.key_name] = val;
    });
    setKeyValues(stored);
  }, []);

  const saveKey = (keyName: string, value: string) => {
    setKeyValues({ ...keyValues, [keyName]: value });
    localStorage.setItem(`api_key_${keyName}`, value);
    setTestStatus({ ...testStatus, [keyName]: value ? 'connected' : 'not_configured' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">API Keys</h2>
        <p className="text-sm text-text-tertiary">Add your API keys - stored locally in your browser</p>
      </div>
      
      <div className="space-y-3">
        {keys.map((key) => (
          <div key={key.id} className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-text-primary">{key.provider}</p>
                <p className="text-sm text-text-tertiary">{key.description}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-md ${
                keyValues[key.key_name] ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              }`}>
                {keyValues[key.key_name] ? 'Saved' : 'Not set'}
              </span>
            </div>
            <input
              type="password"
              placeholder={`Enter ${key.provider} API key...`}
              value={keyValues[key.key_name] || ''}
              onChange={(e) => saveKey(key.key_name, e.target.value)}
              className="input-field w-full text-sm"
            />
          </div>
        ))}
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
        {activeTab === 'branding' && <BrandingTab />}
        {activeTab === 'api-keys' && <ApiKeysTab />}
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'qa-rules' && <QARulesTab />}
        {activeTab === 'export' && <ExportTab />}
      </div>
    </div>
  );
}