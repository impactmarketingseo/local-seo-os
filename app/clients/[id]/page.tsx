'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { cn, slugify } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  niche: string;
  website_url?: string;
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
      
      const [clientRes, servicesRes, citiesRes, keywordsRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', clientId).single(),
        supabase.from('services').select('*').eq('client_id', clientId).order('priority', { ascending: false }),
        supabase.from('cities').select('*').eq('client_id', clientId).order('priority', { ascending: false }),
        supabase.from('keyword_targets').select('*').eq('service_id', servicesRes.data?.[0]?.id),
      ]);

      if (clientRes.data) setClient(clientRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (citiesRes.data) setCities(citiesRes.data);
      if (keywordsRes.data) setKeywords(keywordsRes.data);
      setLoading(false);
    }

    loadClient();
  }, [clientId]);

  async function addService(name: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase.from('services').insert({
      client_id: clientId,
      name,
      slug: slugify(name),
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
      slug: slugify(`${name}-${state}`),
      active: true,
      priority: cities.length,
    });
    const { data } = await supabase.from('cities').select('*').eq('client_id', clientId).order('priority', { ascending: false });
    if (data) setCities(data);
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (!client) {
    return <div className="p-6">Client not found</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/clients" className="text-sm text-muted-foreground hover:underline">← Back to Clients</Link>
          <h1 className="mt-2 text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">{client.niche}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/clients/${clientId}/edit`}
            className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Edit
          </Link>
          <Link
            href={`/clients/${clientId}/queue`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View Queue
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Website</p>
          <p className="mt-1 font-medium">{client.website_url || 'Not set'}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="mt-1 font-medium capitalize">{client.status}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">CTA Preference</p>
          <p className="mt-1 font-medium">{client.cta_preference || 'Not set'}</p>
        </div>
      </div>

      {client.voice_notes && (
        <div className="mb-6 rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Brand Voice Notes</p>
          <p className="mt-1">{client.voice_notes}</p>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <div className="flex border-b">
          {(['services', 'cities', 'keywords'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium capitalize',
                activeTab === tab
                  ? 'border-b-2 border-primary -mb-px text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {tab} ({tab === 'services' ? services.length : tab === 'cities' ? cities.length : keywords.length})
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'services' && (
            <ServiceManager
              services={services}
              onAdd={addService}
              onRemove={async (id) => {
                await createSupabaseBrowserClient().from('services').delete().eq('id', id);
                setServices(services.filter(s => s.id !== id));
              }}
            />
          )}
          {activeTab === 'cities' && (
            <CityManager
              cities={cities}
              onAdd={addCity}
              onRemove={async (id) => {
                await createSupabaseBrowserClient().from('cities').delete().eq('id', id);
                setCities(cities.filter(c => c.id !== id));
              }}
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
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {services.map(s => (
          <div key={s.id} className="flex items-center gap-2 rounded-full border bg-background px-3 py-1">
            <span className="text-sm">{s.name}</span>
            <button onClick={() => onRemove(s.id)} className="text-muted-foreground hover:text-destructive">×</button>
          </div>
        ))}
        {services.length === 0 && <p className="text-sm text-muted-foreground">No services added</p>}
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
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={newState}
          onChange={e => setNewState(e.target.value)}
          placeholder="State"
          className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {cities.map(c => (
          <div key={c.id} className="flex items-center gap-2 rounded-full border bg-background px-3 py-1">
            <span className="text-sm">{c.name}, {c.state}</span>
            <button onClick={() => onRemove(c.id)} className="text-muted-foreground hover:text-destructive">×</button>
          </div>
        ))}
        {cities.length === 0 && <p className="text-sm text-muted-foreground">No cities added</p>}
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
      <p className="mb-2 text-sm text-muted-foreground">
        Keywords are managed at the queue level when adding content to the queue.
      </p>
      <div className="flex flex-wrap gap-2">
        {keywords.length === 0 && (
          <p className="text-sm text-muted-foreground">No keywords yet. Add items to the queue to map keywords.</p>
        )}
      </div>
    </div>
  );
}