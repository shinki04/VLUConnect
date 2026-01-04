-- Add slug column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug text;

-- Backfill existing rows with id
UPDATE profiles SET slug = id::text WHERE slug IS NULL;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_idx ON profiles (slug);

-- Optional: Add check constraint for slug format (if desired in DB level)
-- CONSTRAINT slug_format CHECK (slug ~ '^[a-zA-Z0-9\-_]+$')
