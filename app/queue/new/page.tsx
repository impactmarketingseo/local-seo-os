'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface Client {
  id: string;
  name: string;
  niche: string;
}

interface Service {
  id: string;
  client_id: string;
  name: string;
}

interface City {
  id: string;
  client_id: string;
  name: string;
  state: string;
}

export default function NewQueueItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState({
    client_id: '',
    service_id: '',
    city_id: '',
    keyword: '',
    synonym: '',
    scheduled_for: '',
    priority: 0,
  });

  useEffect(() => {
    async function loadData() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.from('clients').select('*').eq('status', 'active').order('name');
      if (data) setClients(data);
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadServicesCities() {
      if (!form.client_id) return;
      const supabase = createSupabaseBrowserClient();
      const [servicesRes, citiesRes] = await Promise.all([
        supabase.from('services').select('*').eq('client_id', form.client_id).eq('active', true),
        supabase.from('cities').select('*').eq('client_id', form.client_id).eq('active', true),
      ]);
      if (servicesRes.data) setServices(servicesRes.data);
      if (citiesRes.data) setCities(citiesRes.data);
    }
    loadServicesCities();
  }, [form.client_id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    
    const insertData = {
      client_id: form.client_id,
      service_id: form.service_id || null,
      city_id: form.city_id || null,
      notes: form.keyword || null,
      synonym: form.synonym || null,
      scheduled_for: form.scheduled_for || null,
      priority: form.priority,
      status: 'planned',
    };
    
    console.log('Inserting queue item:', insertData);
    
    const { data, error } = await supabase.from('page_queue').insert(insertData).select();
    
    console.log('Insert result:', data, error);
    
    if (error) {
      alert('Error: ' + error.message);
      setLoading(false);
      return;
    }
    
    alert('Queue item created! ID: ' + (data?.[0]?.id || 'unknown'));

    router.push('/queue');
  }

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <button onClick={() => router.back()} className="text-sm text-text-tertiary hover:underline">
        ← Back to Queue
      </button>
      
      <h1 className="mt-2 mb-6 page-title">Add to Content Queue</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="input-label">Client *</label>
          <select
            required
            value={form.client_id}
            onChange={e => setForm({ ...form, client_id: e.target.value, service_id: '', city_id: '' })}
            className="input-field"
          >
            <option value="">Select client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.niche})</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="input-label">Service *</label>
            <select
              required
              value={form.service_id}
              onChange={e => setForm({ ...form, service_id: e.target.value })}
              className="input-field"
            >
              <option value="">Select service...</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">City *</label>
            <select
              required
              value={form.city_id}
              onChange={e => setForm({ ...form, city_id: e.target.value })}
              className="input-field"
            >
              <option value="">Select city...</option>
              {cities.map(c => (
                <option key={c.id} value={c.id}>{c.name}, {c.state}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="input-label">Primary Keyword</label>
            <input
              type="text"
              value={form.keyword}
              onChange={e => setForm({ ...form, keyword: e.target.value })}
              className="input-field"
              placeholder="AC repair Salt Lake City"
            />
          </div>

          <div>
            <label className="input-label">Synonym (optional)</label>
            <input
              type="text"
              value={form.synonym}
              onChange={e => setForm({ ...form, synonym: e.target.value })}
              className="input-field"
              placeholder="air conditioning repair"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="input-label">Schedule For</label>
            <input
              type="datetime-local"
              value={form.scheduled_for}
              onChange={e => setForm({ ...form, scheduled_for: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Priority</label>
            <input
              type="number"
              value={form.priority}
              onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
              className="input-field"
              min="0"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Adding...' : 'Add to Queue'}
        </button>
      </form>
    </div>
  );
}
