-- Add additional_keywords to drafts
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS additional_keywords JSONB;

-- Run in Supabase SQL Editor