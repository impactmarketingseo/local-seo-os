-- Add client_types field to clients table
ALTER TABLE clients ADD COLUMN client_types TEXT[] DEFAULT ARRAY['residential'];
