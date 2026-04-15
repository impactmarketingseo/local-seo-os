'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    
    const banned = form.banned_phrases
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    const { error } = await supabase.from('clients').insert({
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
      status: 'active',
    });

    if (!error) {
      router.push('/clients');
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <button onClick={() => router.back()} className="text-sm text-text-tertiary hover:underline">
        ← Back to Clients
      </button>
      
      <h1 className="mt-2 mb-6 page-title">Add New Client</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="input-label">Client Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="input-field"
            placeholder="ABC Heating & Cooling"
          />
        </div>

        <div>
          <label className="input-label">Niche *</label>
          <input
            type="text"
            required
            value={form.niche}
            onChange={e => setForm({ ...form, niche: e.target.value })}
            className="input-field"
            placeholder="HVAC, Plumbing, Roofing..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="input-label">Phone Number</label>
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
          <label className="input-label">Website URL</label>
          <input
            type="url"
            value={form.website_url}
            onChange={e => setForm({ ...form, website_url: e.target.value })}
            className="input-field"
            placeholder="https://abc-hvac.com"
          />
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

        <div className="grid gap-4 md:grid-cols-2">
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
            placeholder="Notes about brand voice, tone, style..."
          />
        </div>

        <div>
          <label className="input-label">CTA Preference</label>
          <input
            type="text"
            value={form.cta_preference}
            onChange={e => setForm({ ...form, cta_preference: e.target.value })}
            className="input-field"
            placeholder="Call now, request quote..."
          />
        </div>

        <div>
          <label className="input-label">Banned Phrases (comma-separated)</label>
          <input
            type="text"
            value={form.banned_phrases}
            onChange={e => setForm({ ...form, banned_phrases: e.target.value })}
            className="input-field"
            placeholder="cheap, affordable, bargain..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Creating...' : 'Create Client'}
        </button>
      </form>
    </div>
  );
}
