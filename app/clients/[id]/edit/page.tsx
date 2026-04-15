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
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    voice_notes: '',
    cta_preference: '',
    banned_phrases: '',
    services_raw: '',
    cities_raw: '',
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
      
      const [clientRes, wpRes, servicesRes, citiesRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', clientId).single(),
        supabase.from('wordpress_connections').select('*').eq('client_id', clientId).single(),
        supabase.from('services').select('name').eq('client_id', clientId).order('priority'),
        supabase.from('cities').select('name').eq('client_id', clientId).order('priority'),
      ]);

      if (clientRes.data) {
        setClient(clientRes.data);
        const existingServices = servicesRes.data?.map((s: any) => s.name).join(', ') || '';
        const existingCities = citiesRes.data?.map((c: any) => c.name).join(', ') || '';
        
        setForm({
          name: clientRes.data.name,
          niche: clientRes.data.niche,
          website_url: clientRes.data.website_url || '',
          phone: clientRes.data.phone || '',
          email: clientRes.data.email || '',
          address: clientRes.data.address || '',
          city: clientRes.data.city || '',
          state: clientRes.data.state || '',
          voice_notes: clientRes.data.voice_notes || '',
          cta_preference: clientRes.data.cta_preference || '',
          banned_phrases: clientRes.data.banned_phrases?.join(', ') || '',
          status: clientRes.data.status,
          services_raw: existingServices,
          cities_raw: existingCities,
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

    // Update client
    await supabase.from('clients').update({
      name: form.name,
      niche: form.niche,
      website_url: form.website_url || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      voice_notes: form.voice_notes || null,
      cta_preference: form.cta_preference || null,
      banned_phrases: banned.length > 0 ? banned : null,
      status: form.status,
    }).eq('id', clientId);

    // Process services - split by comma, newline, or semicolon
    if (form.services_raw && form.services_raw.trim()) {
      const rawServices = form.services_raw
        .split(/(?:,|;|\n)+/)
        .map(s => s.trim())
        .filter(s => s && s.length > 0);
      
      // Delete existing services first
      await supabase.from('services').delete().eq('client_id', clientId);
      
      // Insert new services
      if (rawServices.length > 0) {
        const serviceRecords = rawServices.map((name, index) => ({
          client_id: clientId,
          name: name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          active: true,
          priority: index,
        }));
        await supabase.from('services').insert(serviceRecords);
      }
    }

    // Process cities - split by comma, newline, or semicolon
    // Use client's state for all cities
    const clientState = form.state || '';
    if (form.cities_raw && form.cities_raw.trim()) {
      const rawCities = form.cities_raw
        .split(/(?:,|;|\n)+/)
        .map(c => c.trim())
        .filter(c => c && c.length > 0);
      
      // Delete existing cities first
      await supabase.from('cities').delete().eq('client_id', clientId);
      
      // Insert new cities with client's state
      if (rawCities.length > 0) {
        const cityRecords = rawCities.map((name, index) => ({
          client_id: clientId,
          name: name,
          state: clientState,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          active: true,
          priority: index,
        }));
        await supabase.from('cities').insert(cityRecords);
      }
    }

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
      <button onClick={() => router.back()} className="text-sm text-text-tertiary hover:underline">
        ← Back to Client
      </button>
      
      <h1 className="mt-2 mb-6 page-title">Edit Client</h1>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="input-label">Client Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="input-label">Niche</label>
          <input
            type="text"
            value={form.niche}
            onChange={e => setForm({ ...form, niche: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="input-label">Website URL</label>
          <input
            type="url"
            value={form.website_url}
            onChange={e => setForm({ ...form, website_url: e.target.value })}
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="input-field"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input-field"
              placeholder="info@company.com"
            />
          </div>
        </div>

        <div>
          <label className="input-label">Business Address</label>
          <input
            type="text"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            className="input-field"
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">City</label>
            <input
              type="text"
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              className="input-field"
              placeholder="Riverton"
            />
          </div>
          <div>
            <label className="input-label">State</label>
            <input
              type="text"
              value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value })}
              className="input-field"
              placeholder="UT"
            />
          </div>
        </div>

        <div>
          <label className="input-label">Brand Voice Notes</label>
          <textarea
            value={form.voice_notes}
            onChange={e => setForm({ ...form, voice_notes: e.target.value })}
            className="input-field"
            rows={3}
          />
        </div>

        <div>
          <label className="input-label">CTA Preference</label>
          <input
            type="text"
            value={form.cta_preference}
            onChange={e => setForm({ ...form, cta_preference: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="input-label">Banned Phrases (comma-separated)</label>
          <input
            type="text"
            value={form.banned_phrases}
            onChange={e => setForm({ ...form, banned_phrases: e.target.value })}
            className="input-field"
          />
        </div>

        <div className="border-t border-border pt-6 mt-6">
          <h3 className="section-title mb-4">Quick Add Services</h3>
          <p className="text-xs text-text-tertiary mb-3">Paste services separated by commas - they'll be created automatically</p>
          <textarea
            value={form.services_raw}
            onChange={e => setForm({ ...form, services_raw: e.target.value })}
            className="input-field"
            rows={3}
            placeholder="AC Repair, Furnace Repair, Water Heater Services, HVAC Maintenance..."
          />
        </div>

        <div>
          <h3 className="section-title mb-4">Quick Add Cities</h3>
          <p className="text-xs text-text-tertiary mb-3">Paste cities separated by commas - they'll be created automatically</p>
          <textarea
            value={form.cities_raw}
            onChange={e => setForm({ ...form, cities_raw: e.target.value })}
            className="input-field"
            rows={3}
            placeholder="Salt Lake City, West Valley City, Provo, Ogden..."
          />
        </div>

        <div>
          <label className="input-label">Status</label>
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            className="input-field"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary"
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