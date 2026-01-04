-- Optimize messages query performance
-- Creates composite index for fast conversation message lookups

-- Drop existing index if exists
DROP INDEX IF EXISTS idx_messages_conversation_lookup;

-- Create optimized composite index
-- Covers: conversation_id + created_at DESC + is_deleted
-- Partial index: only indexes non-deleted messages (most common query)
CREATE INDEX idx_messages_conversation_lookup 
ON public.messages (conversation_id, created_at DESC)
WHERE is_deleted = false;

-- Add comment for documentation
COMMENT ON INDEX idx_messages_conversation_lookup IS 
'Optimized index for fetching conversation messages. Partial index on non-deleted messages for better performance.';
