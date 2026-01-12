-- Migration: Fix Conversation & Messages RLS (20260112000000)
-- 1. Update conversations SELECT policy to allow creators to see their own conversations (fixes "blind" insert/return).
-- 2. Ensure messages INSERT policy allows members to send.

DO $$
BEGIN
  -- Re-create conversations_select_policy
  DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
  CREATE POLICY "conversations_select_policy" ON public.conversations 
  FOR SELECT TO authenticated 
  USING ( 
    func_is_conversation_member(id, auth.uid()) 
    OR 
    created_by = auth.uid() -- Allow creator to see it immediately
    OR 
    func_is_admin() 
  );

  -- Re-create messages_insert_policy (ensure it is correct)
  DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
  CREATE POLICY "messages_insert_policy" ON public.messages 
  FOR INSERT TO authenticated 
  WITH CHECK ( 
    func_is_conversation_member(conversation_id, auth.uid()) -- Must be member to send
    AND 
    sender_id = auth.uid() -- Must be sent by self
  );

END $$;
