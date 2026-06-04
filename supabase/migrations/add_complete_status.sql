-- Add 'complete' status to drafts
ALTER TABLE drafts DROP CONSTRAINT IF EXISTS drafts_status_check;
ALTER TABLE drafts ADD CONSTRAINT drafts_status_check
  CHECK (status IN ('draft', 'review', 'approved', 'complete', 'rejected', 'published'));
