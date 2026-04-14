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
  niche: string;
  website_url?: string;
  voice_notes?: string;
  cta_preference?: string;
  banned_phrases?: string[];
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
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