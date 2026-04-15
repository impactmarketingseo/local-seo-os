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
    services_raw: '',
    cities_raw: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    
    const banned = form.banned_phrases
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    // Create client first
    const { data: client, error } = await supabase.from('clients').insert({
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
    }).select().single();

    if (!error && client) {
      console.log('Client created:', client.id, 'Services input:', form.services_raw);
      
      // Process services - split by comma, newline, or semicolon
      if (form.services_raw && form.services_raw.trim()) {
        // Split by multiple delimiters: comma, semicolon, or newline
        const rawServices = form.services_raw
          .split(/(?:,|;|\n)+/)
          .map(s => s.trim())
          .filter(s => s && s.length > 0);
        
        console.log('Parsed services:', rawServices);
        
        if (rawServices.length > 0) {
          const serviceRecords = rawServices.map((name, index) => ({
            client_id: client.id,
            name: name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            active: true,
            priority: index,
          }));
          
          console.log('Inserting services:', serviceRecords);
          const { error: servicesError } = await supabase.from('services').insert(serviceRecords);
          if (servicesError) {
            console.error('Services insert error:', servicesError);
          }
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
        
        if (rawCities.length > 0) {
          const cityRecords = rawCities.map((name, index) => ({
            client_id: client.id,
            name: name,
            state: clientState,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            active: true,
            priority: index,
          }));
          
          const { error: citiesError } = await supabase.from('cities').insert(cityRecords);
          if (citiesError) {
            console.error('Cities insert error:', citiesError);
          }
        }
      }

      router.push('/clients');
    } else if (error) {
      console.error('Client insert error:', error);
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
