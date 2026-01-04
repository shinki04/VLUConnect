-- Migration: Refactor Conversations & Messages RLS (20251226144500)
-- Implements strict granular roles for Conversation (Admin/Sub-Admin/Mod) and Messages.

DO $$
BEGIN
  -- 1. DROP EXISTING POLICIES on Messages & Conversations to ensure clean slate
  DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
  DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
  DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
  DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
  DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
  DROP POLICY IF EXISTS "conversation_members_select_policy" ON public.conversation_members;
  DROP POLICY IF EXISTS "conversation_members_insert_policy" ON public.conversation_members;
  DROP POLICY IF EXISTS "conversation_members_update_policy" ON public.conversation_members;
  DROP POLICY IF EXISTS "conversation_members_delete_policy" ON public.conversation_members;
  
  -- Drop functions to update signatures/logic
  DROP FUNCTION IF EXISTS func_can_manage_conversation(uuid) CASCADE;
  DROP FUNCTION IF EXISTS func_can_moderate_conversation(uuid) CASCADE;
  DROP FUNCTION IF EXISTS func_is_conversation_member(uuid, uuid) CASCADE;
END $$;


-- ==============================================================================
-- 2. HELPER FUNCTIONS (Refined)
-- ==============================================================================

-- 2.1 Check Membership
CREATE OR REPLACE FUNCTION func_is_conversation_member(c_id uuid, u_id uuid) 
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_members 
    WHERE conversation_id = c_id AND user_id = u_id
  );
$$;

-- 2.2 Check Management (Admin / Sub-Admin)
-- Capabilties: Change Group Settings, Add Members
CREATE OR REPLACE FUNCTION func_can_manage_conversation(c_id uuid) 
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT (
    func_is_admin() -- Global Admin
    OR 
    EXISTS (
      SELECT 1 
      FROM public.conversation_members 
      WHERE conversation_id = c_id 
        AND user_id = auth.uid() 
        AND role IN ('admin', 'sub_admin')
    )
  );
$$;

-- 2.3 Check Moderation (Admin / Sub-Admin / Moderator)
-- Capabilities: Delete Messages
CREATE OR REPLACE FUNCTION func_can_moderate_conversation(c_id uuid) 
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT (
    func_is_admin() -- Global Admin
    OR 
    EXISTS (
      SELECT 1 
      FROM public.conversation_members 
      WHERE conversation_id = c_id 
        AND user_id = auth.uid() 
        AND role IN ('admin', 'sub_admin', 'moderator')
    )
  );
$$;


-- ==============================================================================
-- 3. APPLY RLS POLICIES
-- ==============================================================================

-- 3.1 CONVERSATIONS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_select_policy" ON public.conversations 
FOR SELECT TO authenticated 
USING ( func_is_conversation_member(id, auth.uid()) OR func_is_admin() );

CREATE POLICY "conversations_insert_policy" ON public.conversations 
FOR INSERT TO authenticated 
WITH CHECK ( true );

CREATE POLICY "conversations_update_policy" ON public.conversations 
FOR UPDATE TO authenticated 
USING ( func_can_manage_conversation(id) );


-- 3.2 CONVERSATION MEMBERS
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversation_members_select_policy" ON public.conversation_members 
FOR SELECT TO authenticated 
USING ( func_is_conversation_member(conversation_id, auth.uid()) OR func_is_admin() );

CREATE POLICY "conversation_members_insert_policy" ON public.conversation_members 
FOR INSERT TO authenticated 
WITH CHECK ( 
  user_id = auth.uid() -- Self-Join (QR/Link)
  OR 
  func_can_manage_conversation(conversation_id) -- Admin Add
);

CREATE POLICY "conversation_members_update_policy" ON public.conversation_members 
FOR UPDATE TO authenticated 
USING ( func_can_manage_conversation(conversation_id) );

CREATE POLICY "conversation_members_delete_policy" ON public.conversation_members 
FOR DELETE TO authenticated 
USING ( 
  user_id = auth.uid() -- Leave
  OR 
  func_can_manage_conversation(conversation_id) -- Kick
);


-- 3.3 MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_policy" ON public.messages 
FOR SELECT TO authenticated 
USING ( func_is_conversation_member(conversation_id, auth.uid()) OR func_is_admin() );

CREATE POLICY "messages_insert_policy" ON public.messages 
FOR INSERT TO authenticated 
WITH CHECK ( 
  func_is_conversation_member(conversation_id, auth.uid()) -- Must be member to send
  AND 
  sender_id = auth.uid() -- Must be sent by self
);

CREATE POLICY "messages_update_policy" ON public.messages 
FOR UPDATE TO authenticated 
USING ( sender_id = auth.uid() ); -- Only sender can edit

CREATE POLICY "messages_delete_policy" ON public.messages 
FOR DELETE TO authenticated 
USING ( 
  sender_id = auth.uid() -- Sender can delete own
  OR 
  func_can_moderate_conversation(conversation_id) -- Mod/Admin can delete any
);
