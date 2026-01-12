-- Migration: Make Messages Bucket Public (20260112100000)
-- Description: Changes 'messages' bucket to public for easier file access.
-- RLS still protects INSERT/UPDATE/DELETE operations.

-- Update bucket to public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'messages';

-- Note: RLS policies for INSERT, UPDATE, DELETE remain active
-- Only SELECT via public URL bypasses RLS (expected behavior for public bucket)
