'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface Client {
  id: string;
  name: string;
  niche: string;
  website_url?: string;
  voice_notes?: string;
  cta_preference?: string;
  banned_phrases?: string[];
  status: string;
}

interface WordPressConnection {
  id: string;
  base_url: string;
  username: string;
  enabled: boolean;
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [wpConnection, setWpConnection] = useState<WordPressConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    niche: '',
    website_url: '',
    voice_notes: '',
    cta_preference: '',
    banned_phrases: '',
    status: 'active',
  });
  const [wpForm, setWpForm] = useState({
    base_url: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    async function loadClient() {
      const supabase = createSupabaseBrowserClient();
      
      const [clientRes, wpRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', clientId).single(),
        supabase.from('wordpress_connections').select('*').eq('client_id', clientId).single(),
      ]);

      if (clientRes.data) {
        setClient(clientRes.data);
        setForm({
          name: clientRes.data.name,
          niche: clientRes.data.niche,
          website_url: clientRes.data.website_url || '',
          voice_notes: clientRes.data.voice_notes || '',
          cta_preference: clientRes.data.cta_preference || '',
          banned_phrases: clientRes.data.banned_phrases?.join(', ') || '',
          status: clientRes.data.status,
        });
      }
      if (wpRes.data) {
        setWpConnection(wpRes.data);
        setWpForm({
          base_url: wpRes.data.base_url,
          username: wpRes.data.username,
          password: '',
        });
      }
      setLoading(false);
    }

    loadClient();
  }, [clientId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createSupabaseBrowserClient();
    
    const banned = form.banned_phrases
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    await supabase.from('clients').update({
      name: form.name,
      niche: form.niche,
      website_url: form.website_url || null,
      voice_notes: form.voice_notes || null,
      cta_preference: form.cta_preference || null,
      banned_phrases: banned.length > 0 ? banned : null,
      status: form.status,
    }).eq('id', clientId);

    router.push(`/clients/${clientId}`);
  }

  async function handleSaveWP(e: React.FormEvent) {
    e.preventDefault();
    
    const supabase = createSupabaseBrowserClient();
    const encryptedPassword = Buffer.from(wpForm.password).toString('base64');

    if (wpConnection) {
      await supabase.from('wordpress_connections').update({
        base_url: wpForm.base_url,
        username: wpForm.username,
        encrypted_password: encryptedPassword,
      }).eq('id', wpConnection.id);
    } else {
      await supabase.from('wordpress_connections').insert({
        client_id: clientId,
        base_url: wpForm.base_url,
        username: wpForm.username,
        encrypted_password: encryptedPassword,
        enabled: true,
      });
    }

    alert('WordPress connection saved');
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (!client) {
    return <div className="p-6">Client not found</div>;
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:underline">
        ← Back to Client
      </button>
      
      <h1 className="mt-2 mb-6 text-2xl font-bold">Edit Client</h1>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium">Client Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Niche</label>
          <input
            type="text"
            value={form.niche}
            onChange={e => setForm({ ...form, niche: e.target.value })}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Website URL</label>
          <input
            type="url"
            value={form.website_url}
            onChange={e => setForm({ ...form, website_url: e.target.value })}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Brand Voice Notes</label>
          <textarea
            value={form.voice_notes}
            onChange={e => setForm({ ...form, voice_notes: e.target.value })}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">CTA Preference</label>
          <input
            type="text"
            value={form.cta_preference}
            onChange={e => setForm({ ...form, cta_preference: e.target.value })}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Banned Phrases (comma-separated)</label>
          <input
            type="text"
            value={form.banned_phrases}
            onChange={e => setForm({ ...form, banned_phrases: e.target.value })}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <div className="mt-12 border-t pt-6">
        <h2 className="mb-4 text-lg font-semibold">WordPress Connection</h2>
        
        <form onSubmit={handleSaveWP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">WordPress URL</label>
            <input
              type="url"
              value={wpForm.base_url}
              onChange={e => setWpForm({ ...wpForm, base_url: e.target.value })}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="https://clientwebsite.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">WordPress Username</label>
            <input
              type="text"
              value={wpForm.username}
              onChange={e => setWpForm({ ...wpForm, username: e.target.value })}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Application Password</label>
            <input
              type="password"
              value={wpForm.password}
              onChange={e => setWpForm({ ...wpForm, password: e.target.value })}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={wpConnection ? '••••••••' : 'Enter password'}
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground"
          >
            Save WordPress Connection
          </button>
        </form>
      </div>
    </div>
  );
}