export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  short_name?: string;
  niche: string;
  website_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  years_in_business?: string;
  jobs_completed?: string;
  rating?: string;
  review_count?: string;
  owner_name?: string;
  brands_serviced?: string[];
  financing?: string;
  emergency_hours?: string;
  contact_url?: string;
  services_url?: string;
  credentials?: string[];
  differentiators?: string[];
  service_area_cities?: any[];
  voice_notes?: string;
  cta_preference?: string;
  banned_phrases?: string[];
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  // Populated relations
  services?: Service[];
  cities?: City[];
}

export interface Service {
  id: string;
  client_id: string;
  name: string;
  slug: string;
  active: boolean;
  priority: number;
  template_config?: Record<string, unknown>;
  created_at: string;
}

export interface City {
  id: string;
  client_id: string;
  name: string;
  state: string;
  slug: string;
  active: boolean;
  priority: number;
  population?: number;
  county?: string;
  landmarks?: string[];
  neighborhoods?: string[];
  climate_detail?: string;
  housing_detail?: string;
  created_at: string;
}

export interface KeywordTarget {
  id: string;
  service_id: string;
  city_id: string;
  primary_keyword: string;
  synonym?: string;
  secondary_terms?: string[];
  intent_notes?: string;
  created_at: string;
}

export type QueueStatus = 
  | 'planned' 
  | 'approved' 
  | 'generating' 
  | 'draft_ready' 
  | 'needs_review' 
  | 'approved' 
  | 'exported' 
  | 'sent_to_wp' 
  | 'published' 
  | 'archived';

export interface QueueItem {
  id: string;
  client_id: string;
  service_id?: string;
  city_id?: string;
  keyword_target_id?: string;
  status: QueueStatus;
  scheduled_for?: string;
  priority: number;
  generation_mode: 'manual' | 'scheduled';
  owner_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Populated relations
  client?: Client;
  service?: Service;
  city?: City;
  keyword_target?: KeywordTarget;
}

export type DraftStatus = 'draft' | 'review' | 'approved' | 'rejected' | 'published';

export interface Draft {
  id: string;
  queue_id?: string;
  client_id?: string;
  service_id?: string;
  city_id?: string;
  status: DraftStatus;
  version_number: number;
  generation_model?: string;
  token_count?: number;
  cost_cents?: number;
  created_at: string;
  updated_at: string;
  // Populated relations
  queue?: QueueItem;
  client?: Client;
  service?: Service;
  city?: City;
  content?: DraftContent;
}

export interface DraftContent {
  id: string;
  draft_id: string;
  meta?: {
    title: string;
    description: string;
    h1: string;
    slug: string;
  };
  breadcrumb?: string;
  hero?: {
    review_line: string;
    intro_paragraph: string;
    cta_primary_text: string;
    cta_secondary_text: string;
    trust_badges: string[];
  };
  trust_strip?: string[];
  problems?: {
    section_heading: string;
    section_subtext: string;
    cards: {
      icon: string;
      title: string;
      description: string;
    }[];
  };
  why_choose_us?: {
    section_heading: string;
    section_subtext: string;
    items: {
      icon: string;
      title: string;
      description: string;
    }[];
    image_alt?: string;
  };
  process?: {
    section_heading: string;
    section_subtext: string;
    steps: {
      icon: string;
      title: string;
      description: string;
    }[];
  };
  faq?: {
    section_heading: string;
    items: {
      question: string;
      answer: string;
    }[];
  };
  local_context?: {
    section_heading: string;
    paragraph_1: string;
    paragraph_2: string;
  };
  internal_links?: {
    other_services_in_city: { text: string; url: string }[];
    same_service_other_cities: { text: string; url: string }[];
  };
  final_cta?: {
    heading: string;
    subtext: string;
    cta_primary_text: string;
    cta_secondary_text: string;
    footer_line: string;
  };
  schema_markup?: {
    local_business: string;
    faq_page: string;
    service: string;
    breadcrumb_list: string;
  };
  created_at: string;
  updated_at: string;
}

export interface DraftSection {
  heading: string;
  content: string;
  order: number;
}

export interface DraftFAQ {
  question: string;
  answer: string;
}

export interface Draft {
  id: string;
  queue_id?: string;
  client_id?: string;
  title?: string;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  h1?: string;
  intro?: string;
  sections?: DraftSection[];
  faqs?: DraftFAQ[];
  cta_block?: string;
  internal_links?: { title: string; url: string }[];
  schema_notes?: Record<string, unknown>;
  content_json: Record<string, unknown>;
  content_text?: string;
  status: DraftStatus;
  version_number: number;
  generation_model?: string;
  token_count?: number;
  cost_cents?: number;
  created_at: string;
  updated_at: string;
  // Populated relations
  queue?: QueueItem;
  client?: Client;
}

export interface DraftVersion {
  id: string;
  draft_id: string;
  version_number: number;
  content_json: Record<string, unknown>;
  change_notes?: string;
  created_at: string;
}

export interface PublishingLog {
  id: string;
  draft_id?: string;
  client_id?: string;
  action_type: 'export' | 'create_draft' | 'publish';
  destination?: string;
  wp_post_id?: number;
  wp_post_url?: string;
  success: boolean;
  response_summary?: Record<string, unknown>;
  created_at: string;
}

export interface PromptVersion {
  id: string;
  name: string;
  version_label: string;
  active: boolean;
  prompt_text: string;
  model_settings?: Record<string, unknown>;
  created_at: string;
}

export interface WordPressConnection {
  id: string;
  client_id: string;
  base_url: string;
  username: string;
  encrypted_password: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface GenerationLog {
  id: string;
  queue_id?: string;
  draft_id?: string;
  prompt_version_id?: string;
  status: string;
  error_message?: string;
  token_count?: number;
  cost_cents?: number;
  created_at: string;
}

export interface PromptPacket {
  client_context: {
    niche: string;
    brand_voice: string;
    cta_style: string;
    page_structure: string;
    banned_phrases: string[];
    linking_rules: string;
  };
  generation_inputs: {
    service: string;
    city: string;
    state: string;
    primary_keyword: string;
    synonym?: string;
    supporting_terms: string[];
    page_intent: string;
    target_audience: string;
  };
  formatting: {
    section_list: string[];
    faq_count: number;
    local_relevance_rules: string;
    metadata_rules: string;
  };
  quality_constraints: string[];
}

export interface GenerationResult {
  title: string;
  meta_title: string;
  meta_description: string;
  slug: string;
  h1: string;
  intro: string;
  sections: DraftSection[];
  faqs: DraftFAQ[];
  cta: string;
  internal_links: { title: string; url: string }[];
  schema_notes: Record<string, unknown>;
}