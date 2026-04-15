-- Local SEO Content Operating System - V1 Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS - Internal team accounts
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CLIENTS - Managed business accounts
-- ============================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    niche TEXT NOT NULL,
    website_url TEXT,
    voice_notes TEXT,
    cta_preference TEXT,
    banned_phrases TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SERVICES - Service targets per client
-- ============================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    template_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CITIES - Location targets per client
-- ============================================
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    slug TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- KEYWORD TARGETS - Keyword maps per service/city
-- ============================================
CREATE TABLE keyword_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    primary_keyword TEXT NOT NULL,
    synonym TEXT,
    secondary_terms TEXT[],
    intent_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PAGE QUEUE - Execution plan
-- ============================================
CREATE TABLE page_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    keyword_target_id UUID REFERENCES keyword_targets(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'planned' CHECK (status IN (
        'planned', 'approved', 'generating', 'draft_ready',
        'needs_review', 'approved', 'exported', 'sent_to_wp',
        'published', 'archived'
    )),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    priority INTEGER DEFAULT 0,
    generation_mode TEXT DEFAULT 'manual' CHECK (generation_mode IN ('manual', 'scheduled')),
    owner_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DRAFTS - Generated page outputs
-- ============================================
CREATE TABLE drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID REFERENCES page_queue(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    title TEXT,
    slug TEXT,
    meta_title TEXT,
    meta_description TEXT,
    h1 TEXT,
    intro TEXT,
    sections JSONB,
    faqs JSONB,
    cta_block TEXT,
    internal_links JSONB,
    schema_notes JSONB,
    content_json JSONB NOT NULL,
    content_text TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'published')),
    version_number INTEGER DEFAULT 1,
    generation_model TEXT DEFAULT 'claude-sonnet-4-20250514',
    token_count INTEGER,
    cost_cents INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DRAFT VERSIONS - Version history
-- ============================================
CREATE TABLE draft_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content_json JSONB NOT NULL,
    change_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PUBLISHING LOGS - Deployment history
-- ============================================
CREATE TABLE publishing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID REFERENCES drafts(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('export', 'create_draft', 'publish')),
    destination TEXT,
    wp_post_id INTEGER,
    wp_post_url TEXT,
    success BOOLEAN DEFAULT true,
    response_summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROMPT VERSIONS - Prompt governance
-- ============================================
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    version_label TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    prompt_text TEXT NOT NULL,
    model_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WORDPRESS CONNECTIONS - WP credentials
-- ============================================
CREATE TABLE wordpress_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
    base_url TEXT NOT NULL,
    username TEXT NOT NULL,
    encrypted_password TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- GENERATION LOGS - Audit trail
-- ============================================
CREATE TABLE generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID REFERENCES page_queue(id) ON DELETE SET NULL,
    draft_id UUID REFERENCES drafts(id) ON DELETE SET NULL,
    prompt_version_id UUID REFERENCES prompt_versions(id),
    status TEXT NOT NULL,
    error_message TEXT,
    token_count INTEGER,
    cost_cents INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    email_drafts_ready BOOLEAN DEFAULT true,
    email_published BOOLEAN DEFAULT true,
    in_app_drafts_ready BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_services_client ON services(client_id);
CREATE INDEX idx_cities_client ON cities(client_id);
CREATE INDEX idx_keyword_targets_service ON keyword_targets(service_id);
CREATE INDEX idx_keyword_targets_city ON keyword_targets(city_id);
CREATE INDEX idx_page_queue_client ON page_queue(client_id);
CREATE INDEX idx_page_queue_status ON page_queue(status);
CREATE INDEX idx_page_queue_scheduled ON page_queue(scheduled_for);
CREATE INDEX idx_drafts_queue ON drafts(queue_id);
CREATE INDEX idx_drafts_client ON drafts(client_id);
CREATE INDEX idx_drafts_status ON drafts(status);
CREATE INDEX idx_draft_versions_draft ON draft_versions(draft_id);
CREATE INDEX idx_publishing_logs_draft ON publishing_logs(draft_id);
CREATE INDEX idx_publishing_logs_client ON publishing_logs(client_id);
CREATE INDEX idx_generation_logs_queue ON generation_logs(queue_id);
CREATE INDEX idx_generation_logs_draft ON generation_logs(draft_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Users can only see their own data (internal tool RLS is minimal)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Admins can manage users" ON users FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Clients: full access for authenticated users
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage clients" ON clients FOR ALL USING (auth.role() = 'authenticated');

-- Services, Cities, Keywords
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage services" ON services FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage cities" ON cities FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE keyword_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage keywords" ON keyword_targets FOR ALL USING (auth.role() = 'authenticated');

-- Page Queue
ALTER TABLE page_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage queue" ON page_queue FOR ALL USING (auth.role() = 'authenticated');

-- Drafts
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage drafts" ON drafts FOR ALL USING (auth.role() = 'authenticated');

-- Publishing Logs
ALTER TABLE publishing_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view logs" ON publishing_logs FOR SELECT USING (auth.role() = 'authenticated');

-- Prompt Versions
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage prompts" ON prompt_versions FOR ALL USING (auth.role() = 'authenticated');

-- WordPress Connections
ALTER TABLE wordpress_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage WP connections" ON wordpress_connections FOR ALL USING (auth.role() = 'authenticated');

-- Generation Logs
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view generation logs" ON generation_logs FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- DEFAULT PROMPT VERSION
-- ============================================
INSERT INTO prompt_versions (name, version_label, active, prompt_text, model_settings)
VALUES (
    'Local SEO City Service Page',
    'v1.0',
    true,
    'You are a professional SEO content writer specializing in local service business websites...',
    '{"model": "claude-sonnet-4-20250514", "max_tokens": 4000}'
);
-- ============================================
-- APP SETTINGS - Branding & configuration
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default settings (only if table is empty)
INSERT INTO app_settings (key, value) 
SELECT 'branding', '{"logo_url": null, "app_name": "SEO OS", "accent_color": "#3B82F6"}'
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'branding');

INSERT INTO app_settings (key, value) 
SELECT 'general', '{"timezone": "America/New_York"}'
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'general');

-- RLS - allow public read/write for this internal app
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON app_settings;
CREATE POLICY "Allow public access" ON app_settings FOR ALL USING (true) WITH CHECK (true);
