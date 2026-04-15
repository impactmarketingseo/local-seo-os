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

  async function addCity(name: string, state: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('cities').insert({
      client_id: clientId,
      name,
      state,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      active: true,
      priority: cities.length,
    });
    const { data } = await supabase.from('cities').select('*').eq('client_id', clientId).order('priority', { ascending: false });
    if (data) setCities(data);
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
            href={`/clients/${clientId}/queue`}
            className="btn-primary"
          >
            View Queue
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="card-standard">
          <p className="text-xs font-medium uppercase tracking-wider text-text-disabled">Website</p>
          <p className="mt-1 font-medium text-text-primary">{client.website_url || 'Not set'}</p>
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
  const [newService, setNewService] = useState('');

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newService}
          onChange={e => setNewService(e.target.value)}
          placeholder="Service name"
          className="input-field flex-1"
          onKeyDown={async e => {
            if (e.key === 'Enter' && newService.trim()) {
              await onAdd(newService.trim());
              setNewService('');
            }
          }}
        />
        <button
          onClick={async () => {
            if (newService.trim()) {
              await onAdd(newService.trim());
              setNewService('');
            }
          }}
          className="btn-primary"
        >
          Add
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

function CityManager({ cities, onAdd, onRemove }: {
  cities: City[];
  onAdd: (name: string, state: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newCity}
          onChange={e => setNewCity(e.target.value)}
          placeholder="City"
          className="input-field flex-1"
        />
        <input
          type="text"
          value={newState}
          onChange={e => setNewState(e.target.value)}
          placeholder="State"
          className="input-field w-24"
          onKeyDown={async e => {
            if (e.key === 'Enter' && newCity.trim() && newState.trim()) {
              await onAdd(newCity.trim(), newState.trim());
              setNewCity('');
              setNewState('');
            }
          }}
        />
        <button
          onClick={async () => {
            if (newCity.trim() && newState.trim()) {
              await onAdd(newCity.trim(), newState.trim());
              setNewCity('');
              setNewState('');
            }
          }}
          className="btn-primary"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {cities.map(c => (
          <div key={c.id} className="flex items-center gap-2 rounded-full bg-input px-3 py-1">
            <span className="text-sm text-text-primary">{c.name}, {c.state}</span>
            <button onClick={() => onRemove(c.id)} className="text-text-tertiary hover:text-error">×</button>
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
