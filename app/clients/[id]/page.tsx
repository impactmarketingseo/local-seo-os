'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface Client {
  id: string;
  name: string;
  niche: string;
  website_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  voice_notes?: string;
  cta_preference?: string;
  banned_phrases?: string[];
  status: string;
  created_at: string;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  priority: number;
}

interface City {
  id: string;
  name: string;
  state: string;
  slug: string;
  active: boolean;
  priority: number;
}

interface KeywordTarget {
  id: string;
  service_id: string;
  city_id: string;
  primary_keyword: string;
  synonym?: string;
  secondary_terms?: string[];
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [keywords, setKeywords] = useState<KeywordTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'cities' | 'keywords'>('services');

  useEffect(() => {
    async function loadClient() {
      const supabase = createSupabaseBrowserClient();
      
      const [clientRes, servicesRes, citiesRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', clientId).single(),
        supabase.from('services').select('*').eq('client_id', clientId).order('priority', { ascending: false }),
        supabase.from('cities').select('*').eq('client_id', clientId).order('priority', { ascending: false }),
      ]);

      if (clientRes.data) setClient(clientRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (citiesRes.data) setCities(citiesRes.data);

      if (servicesRes.data?.[0]?.id) {
        const keywordsRes = await supabase.from('keyword_targets').select('*').eq('service_id', servicesRes.data[0].id);
        if (keywordsRes.data) setKeywords(keywordsRes.data);
      }
      setLoading(false);
    }

    loadClient();
  }, [clientId]);

  async function addService(name: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('services').insert({
      client_id: clientId,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      active: true,
      priority: services.length,
    });
    const { data } = await supabase.from('services').select('*').eq('client_id', clientId).order('priority', { ascending: false });
    if (data) setServices(data);
  }

  async function addCity(name: string) {
    const supabase = createSupabaseBrowserClient();
    const stateToUse = client?.state || '';
    console.log('addCity called:', name, 'state:', stateToUse, 'clientState:', client?.state);
    
    if (!stateToUse) {
      alert('Client has no state set. Please edit the client and add a state.');
      return;
    }
    
    const { data, error } = await supabase.from('cities').insert({
      client_id: clientId,
      name,
      state: stateToUse,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      active: true,
      priority: cities.length,
    }).select();
    
    console.log('Insert result:', data, error);
    
    if (error) {
      alert('Error: ' + error.message);
    }
    
    const { data: refreshed } = await supabase.from('cities').select('*').eq('client_id', clientId).order('priority', { ascending: false });
    if (refreshed) setCities(refreshed);
  }

  async function removeService(id: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('services').delete().eq('id', id);
    setServices(services.filter(s => s.id !== id));
  }

  async function removeCity(id: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('cities').delete().eq('id', id);
    setCities(cities.filter(c => c.id !== id));
  }

  if (loading) {
    return <div className="p-6 text-text-tertiary">Loading...</div>;
  }

  if (!client) {
    return <div className="p-6 text-text-primary">Client not found</div>;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/clients" className="text-sm text-text-tertiary hover:underline">← Back to Clients</Link>
          <h1 className="mt-2 page-title">{client.name}</h1>
          <p className="text-text-tertiary">{client.niche}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/clients/${clientId}/edit`}
            className="btn-secondary"
          >
            Edit
          </Link>
          <Link
            href="/queue"
            className="btn-primary"
          >
            View Queue
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="card-standard">
          <p className="text-xs font-medium uppercase tracking-wider text-text-disabled">Website</p>
          <p className="mt-1 font-medium text-text-primary">{client.website_url || 'Not set'}</p>
        </div>
        <div className="card-standard">
          <p className="text-xs font-medium uppercase tracking-wider text-text-disabled">State</p>
          <p className="mt-1 font-medium text-text-primary">{client.state || 'Not set'}</p>
        </div>
        <div className="card-standard">
          <p className="text-xs font-medium uppercase tracking-wider text-text-disabled">Status</p>
          <p className="mt-1 font-medium capitalize">{client.status}</p>
        </div>
        <div className="card-standard">
          <p className="text-xs font-medium uppercase tracking-wider text-text-disabled">CTA Preference</p>
          <p className="mt-1 font-medium text-text-primary">{client.cta_preference || 'Not set'}</p>
        </div>
      </div>

      {client.voice_notes && (
        <div className="mb-6 card-standard">
          <p className="text-xs font-medium uppercase tracking-wider text-text-disabled">Brand Voice Notes</p>
          <p className="mt-1 text-text-secondary">{client.voice_notes}</p>
        </div>
      )}

      <div className="card-standard">
        <div className="flex border-b border-border mb-4">
          {(['services', 'cities', 'keywords'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {tab} ({tab === 'services' ? services.length : tab === 'cities' ? cities.length : keywords.length})
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'services' && (
            <ServiceManager
              services={services}
              onAdd={addService}
              onRemove={removeService}
            />
          )}
          {activeTab === 'cities' && (
            <CityManager
              cities={cities}
              clientState={client?.state || ''}
              onAdd={addCity}
              onRemove={removeCity}
            />
          )}
          {activeTab === 'keywords' && (
            <KeywordManager keywords={keywords} services={services} cities={cities} />
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceManager({ services, onAdd, onRemove }: {
  services: Service[];
  onAdd: (name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [bulkServices, setBulkServices] = useState('');

  async function handleBulkAdd() {
    if (!bulkServices.trim()) return;
    
    const serviceList = bulkServices
      .split(/(?:,|;|\n)+/)
      .map(s => s.trim())
      .filter(s => s && s.length > 0);
    
    for (const service of serviceList) {
      await onAdd(service);
    }
    setBulkServices('');
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="input-label">Bulk Add Services (comma-separated)</label>
        <textarea
          value={bulkServices}
          onChange={e => setBulkServices(e.target.value)}
          className="input-field"
          rows={3}
          placeholder="AC Repair, Furnace Repair, Water Heater..."
        />
        <button
          type="button"
          onClick={handleBulkAdd}
          disabled={!bulkServices.trim()}
          className="btn-primary mt-2"
        >
          Add Services
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {services.map(s => (
          <div key={s.id} className="flex items-center gap-2 rounded-full bg-input px-3 py-1">
            <span className="text-sm text-text-primary">{s.name}</span>
            <button onClick={() => onRemove(s.id)} className="text-text-tertiary hover:text-error">×</button>
          </div>
        ))}
        {services.length === 0 && <p className="text-sm text-text-tertiary">No services added</p>}
      </div>
    </div>
  );
}

function CityManager({ cities, clientState, onAdd, onRemove }: {
  cities: City[];
  clientState: string;
  onAdd: (name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [bulkCities, setBulkCities] = useState('');

  async function handleBulkAdd() {
    if (!bulkCities.trim() || !clientState) return;
    
    const cityList = bulkCities
      .split(/(?:,|;|\n)+/)
      .map(c => c.trim())
      .filter(c => c && c.length > 0);
    
    for (const city of cityList) {
      await onAdd(city);
    }
    setBulkCities('');
  }

  return (
    <div className="space-y-4">
      {clientState ? (
        <div>
          <label className="input-label">Bulk Add Cities (comma-separated)</label>
          <textarea
            value={bulkCities}
            onChange={e => setBulkCities(e.target.value)}
            className="input-field"
            rows={3}
            placeholder={`Salt Lake City, West Valley City, Provo (will be tagged with ${clientState})`}
          />
          <button
            type="button"
            onClick={handleBulkAdd}
            disabled={!bulkCities.trim()}
            className="btn-primary mt-2"
          >
            Add Cities
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <p className="text-warning font-medium">Client has no state set</p>
          <p className="text-sm text-text-tertiary mt-1">Edit this client and add a state to add cities.</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {cities.map(c => (
          <div key={c.id} className="flex items-center gap-2 rounded-full bg-input px-3 py-1">
            <span className="text-sm text-text-primary">{c.name}, {c.state}</span>
            <button type="button" onClick={() => onRemove(c.id)} className="text-text-tertiary hover:text-error">×</button>
          </div>
        ))}
        {cities.length === 0 && <p className="text-sm text-text-tertiary">No cities added</p>}
      </div>
    </div>
  );
}

function KeywordManager({ keywords, services, cities }: {
  keywords: KeywordTarget[];
  services: Service[];
  cities: City[];
}) {
  return (
    <div>
      <p className="mb-2 text-sm text-text-tertiary">
        Keywords are managed at the queue level when adding content to the queue.
      </p>
      <div className="flex flex-wrap gap-2">
        {keywords.length === 0 && (
          <p className="text-sm text-text-tertiary">No keywords yet. Add items to the queue to map keywords.</p>
        )}
      </div>
    </div>
  );
}
