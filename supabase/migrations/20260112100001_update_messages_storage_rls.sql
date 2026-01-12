-- Migration: Update Messages Storage RLS for new folder structure (20260112100001)
-- Description: Updates RLS policies to support new folder structure: 
--              messages/{conversation_id}/{unique_id}/{original_filename}
-- The regex now allows for nested folders within the conversation_id folder.

-- 3.1 SELECT (Download/View) - Updated regex
DROP POLICY IF EXISTS "Messages Select Policy" ON storage.objects;

CREATE POLICY "Messages Select Policy" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'messages'
  AND (
    -- Admin access
    public.func_is_admin()
    OR
    (
      -- Validate path structure: uuid/anything (nested folders allowed)
      name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.+$'
      AND
      -- Check membership using the UUID from the first folder
      public.func_is_conversation_member(
        (storage.foldername(name))[1]::uuid,
        auth.uid()
      )
    )
  )
);

-- 3.2 INSERT (Upload) - Updated regex
DROP POLICY IF EXISTS "Messages Insert Policy" ON storage.objects;

CREATE POLICY "Messages Insert Policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'messages'
  AND (
    -- Validate path structure: uuid/anything (nested folders allowed)
    name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.+$'
    AND
    -- Check membership
    public.func_is_conversation_member(
      (storage.foldername(name))[1]::uuid,
      auth.uid()
    )
  )
);

-- 3.3 UPDATE - Updated regex
DROP POLICY IF EXISTS "Messages Update Policy" ON storage.objects;

CREATE POLICY "Messages Update Policy" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'messages' 
  AND owner = auth.uid()
  AND (
    name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.+$'
    AND
    public.func_is_conversation_member(
      (storage.foldername(name))[1]::uuid,
      auth.uid()
    )
  )
);

-- 3.4 DELETE - Updated regex  
DROP POLICY IF EXISTS "Messages Delete Policy" ON storage.objects;

CREATE POLICY "Messages Delete Policy" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'messages'
  AND (
    public.func_is_admin()
    OR
    (
      name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.+$'
      AND
      public.func_is_conversation_member(
        (storage.foldername(name))[1]::uuid,
        auth.uid()
      )
      AND
      (
        owner = auth.uid() -- Owner
        OR
        public.func_can_moderate_conversation((storage.foldername(name))[1]::uuid) -- Moderator
      )
    )
  )
);
