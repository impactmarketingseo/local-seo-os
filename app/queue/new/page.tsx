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
    if (!form.client_id || !form.service_id || !form.city_id) return;

    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    const { data: queueItem, error } = await supabase.from('page_queue').insert({
      client_id: form.client_id,
      service_id: form.service_id,
      city_id: form.city_id,
      scheduled_for: form.scheduled_for || null,
      priority: form.priority,
      generation_mode: form.scheduled_for ? 'scheduled' : 'manual',
      status: 'planned',
    }).select().single();

    if (!error && queueItem && form.keyword) {
      await supabase.from('keyword_targets').insert({
        service_id: form.service_id,
        city_id: form.city_id,
        primary_keyword: form.keyword,
        synonym: form.synonym || null,
      });
    }

    router.push('/queue');
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Add to Content Queue</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium">Client *</label>
          <select
            required
            value={form.client_id}
            onChange={e => setForm({ ...form, client_id: e.target.value, service_id: '', city_id: '' })}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.niche})</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Service *</label>
            <select
              required
              value={form.service_id}
              onChange={e => setForm({ ...form, service_id: e.target.value })}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select service...</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">City *</label>
            <select
              required
              value={form.city_id}
              onChange={e => setForm({ ...form, city_id: e.target.value })}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
            <label className="block text-sm font-medium">Primary Keyword</label>
            <input
              type="text"
              value={form.keyword}
              onChange={e => setForm({ ...form, keyword: e.target.value })}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="AC repair Riverton"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Synonym (optional)</label>
            <input
              type="text"
              value={form.synonym}
              onChange={e => setForm({ ...form, synonym: e.target.value })}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="air conditioning service"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Scheduled For</label>
            <input
              type="datetime-local"
              value={form.scheduled_for}
              onChange={e => setForm({ ...form, scheduled_for: e.target.value })}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Priority</label>
            <input
              type="number"
              value={form.priority}
              onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add to Queue'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}