-- Migration: Refactor ALL RLS policies with strict function-based logic
-- Enforces "TO authenticated" on all policies.

-- ==============================================================================
-- 0. CLEANUP (Drop existing functions to allow signature changes)
-- ==============================================================================
DROP FUNCTION IF EXISTS func_is_admin() CASCADE;
DROP FUNCTION IF EXISTS func_is_friend(uuid) CASCADE;
DROP FUNCTION IF EXISTS func_is_group_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS func_is_group_admin(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS func_can_manage_group(uuid) CASCADE;
DROP FUNCTION IF EXISTS func_can_view_group(uuid) CASCADE;
DROP FUNCTION IF EXISTS func_can_view_post(uuid) CASCADE;
DROP FUNCTION IF EXISTS func_can_edit_post(uuid) CASCADE;
DROP FUNCTION IF EXISTS func_is_conversation_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS func_can_manage_conversation(uuid) CASCADE;

-- ==============================================================================
-- 1. HELPER FUNCTIONS
-- ==============================================================================

-- 1.1 Check Global Admin
CREATE OR REPLACE FUNCTION func_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND global_role = 'admin'
  );
$$;

-- 1.2 Check Friendship
CREATE OR REPLACE FUNCTION func_is_friend(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friendships
    WHERE (requester_id = auth.uid() AND addressee_id = target_user_id AND status = 'friends')
       OR (requester_id = target_user_id AND addressee_id = auth.uid() AND status = 'friends')
  );
$$;

-- 1.3 Group Helpers
CREATE OR REPLACE FUNCTION func_is_group_member(target_group_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = target_group_id
      AND user_id = target_user_id
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION func_is_group_admin(target_group_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = target_group_id
      AND user_id = target_user_id
      AND role IN ('admin', 'sub_admin') -- Assuming sub_admin can manage some aspects, strict admin checks might need separate func
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION func_can_manage_group(target_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (
    func_is_admin() -- Global Admin
    OR
    EXISTS ( -- Group Admin/Owner
      SELECT 1
      FROM public.group_members
      WHERE group_id = target_group_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND status = 'active'
    )
  );
$$;

CREATE OR REPLACE FUNCTION func_can_view_group(target_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_privacy text;
BEGIN
  SELECT privacy_level INTO v_privacy FROM public.groups WHERE id = target_group_id;
  
  IF v_privacy IS NULL THEN RETURN FALSE; END IF;
  
  -- Public: Everyone sees
  IF v_privacy = 'public' THEN RETURN TRUE; END IF;
  
  -- Private/Secret: Only members (and Global Admins)
  IF func_is_admin() THEN RETURN TRUE; END IF;
  
  RETURN func_is_group_member(target_group_id, auth.uid());
END;
$$;

-- 1.4 Post Helpers
CREATE OR REPLACE FUNCTION func_can_view_post(target_post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_post RECORD;
  v_user_id uuid := auth.uid();
BEGIN
  SELECT author_id, privacy_level, group_id, moderation_status
  INTO v_post
  FROM public.posts
  WHERE id = target_post_id;

  IF v_post IS NULL THEN RETURN FALSE; END IF;

  -- Admin / Author always access
  IF func_is_admin() OR v_post.author_id = v_user_id THEN
    RETURN TRUE;
  END IF;

  -- Moderation check (Others strictly see approved)
  IF v_post.moderation_status <> 'approved' THEN
    RETURN FALSE;
  END IF;
  
  -- Group Post check
  IF v_post.group_id IS NOT NULL THEN
    -- Must have access to the group to see the post
    IF NOT func_can_view_group(v_post.group_id) THEN
      RETURN FALSE;
    END IF;
    -- If group access is okay, standard privacy applies? 
    -- Typically group posts inherit group visibility, but can be further restricted?
    -- Assuming if you can see group, you see its posts unless post is private?
    -- For simplicity and complying with "existing rules":
    RETURN TRUE; 
  END IF;

  -- Privacy Levels (Non-Group)
  IF v_post.privacy_level = 'public' THEN RETURN TRUE; END IF;
  
  IF v_post.privacy_level = 'friends' THEN
    RETURN func_is_friend(v_post.author_id);
  END IF;

  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION func_can_edit_post(target_post_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.posts
    WHERE id = target_post_id
      AND (
        author_id = auth.uid()
        OR
        func_is_admin()
      )
  );
$$;

-- 1.5 Conversation Helpers
CREATE OR REPLACE FUNCTION func_is_conversation_member(target_conversation_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members
    WHERE conversation_id = target_conversation_id
      AND user_id = target_user_id
  );
$$;

CREATE OR REPLACE FUNCTION func_can_manage_conversation(target_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Only for Group conversations basically.
  SELECT (
    func_is_admin() -- Global
    OR 
    EXISTS ( -- Conversation Admin
      SELECT 1 
      FROM public.conversation_members
      WHERE conversation_id = target_conversation_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'sub_admin')
    )
  );
$$;


-- ==============================================================================
-- 2. APPLY RLS POLICIES (Strict Clean Slate)
-- ==============================================================================

-- 2.1 PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
-- Cleanup old potentially named policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING ( true );
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING ( id = auth.uid() );


-- 2.2 FRIENDSHIPS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "friendships_select" ON public.friendships;
DROP POLICY IF EXISTS "friendships_insert" ON public.friendships;
DROP POLICY IF EXISTS "friendships_update" ON public.friendships;

CREATE POLICY "friendships_select_policy" ON public.friendships FOR SELECT TO authenticated 
USING ( requester_id = auth.uid() OR addressee_id = auth.uid() );

CREATE POLICY "friendships_insert_policy" ON public.friendships FOR INSERT TO authenticated 
WITH CHECK ( requester_id = auth.uid() );

CREATE POLICY "friendships_update_policy" ON public.friendships FOR UPDATE TO authenticated 
USING ( requester_id = auth.uid() OR addressee_id = auth.uid() );


-- 2.3 GROUPS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groups_select" ON public.groups;
DROP POLICY IF EXISTS "groups_insert" ON public.groups;
DROP POLICY IF EXISTS "groups_update" ON public.groups;
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.groups;

CREATE POLICY "groups_select_policy" ON public.groups FOR SELECT TO authenticated 
USING ( func_can_view_group(id) );

CREATE POLICY "groups_insert_policy" ON public.groups FOR INSERT TO authenticated 
WITH CHECK ( true ); -- Anyone can create

CREATE POLICY "groups_update_policy" ON public.groups FOR UPDATE TO authenticated 
USING ( func_can_manage_group(id) );


-- 2.4 GROUP MEMBERS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
DROP POLICY IF EXISTS "group_members_insert" ON public.group_members;
DROP POLICY IF EXISTS "group_members_update" ON public.group_members;
DROP POLICY IF EXISTS "group_members_delete" ON public.group_members;

CREATE POLICY "group_members_select_policy" ON public.group_members FOR SELECT TO authenticated 
USING ( func_is_group_member(group_id, auth.uid()) OR func_can_manage_group(group_id) );

CREATE POLICY "group_members_insert_policy" ON public.group_members FOR INSERT TO authenticated 
WITH CHECK ( 
  user_id = auth.uid() -- Join 
  OR 
  func_can_manage_group(group_id) -- Add others
);

CREATE POLICY "group_members_update_policy" ON public.group_members FOR UPDATE TO authenticated 
USING ( func_can_manage_group(group_id) );

CREATE POLICY "group_members_delete_policy" ON public.group_members FOR DELETE TO authenticated 
USING ( 
  user_id = auth.uid() -- Leave
  OR 
  func_can_manage_group(group_id) -- Kick
);


-- 2.5 POSTS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
-- Drop everything
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_update_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Admin can do everything" ON public.posts;

CREATE POLICY "posts_select_policy" ON public.posts FOR SELECT TO authenticated 
USING ( func_can_view_post(id) );

CREATE POLICY "posts_insert_policy" ON public.posts FOR INSERT TO authenticated 
WITH CHECK ( auth.uid() = author_id );

CREATE POLICY "posts_update_policy" ON public.posts FOR UPDATE TO authenticated 
USING ( func_can_edit_post(id) );

CREATE POLICY "posts_delete_policy" ON public.posts FOR DELETE TO authenticated 
USING ( func_can_edit_post(id) );


-- 2.6 POST COMMENTS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON public.post_comments;
DROP POLICY IF EXISTS "comments_insert" ON public.post_comments;
DROP POLICY IF EXISTS "comments_update" ON public.post_comments;
DROP POLICY IF EXISTS "comments_delete" ON public.post_comments;

CREATE POLICY "comments_select_policy" ON public.post_comments FOR SELECT TO authenticated 
USING ( func_can_view_post(post_id) ); -- Visibility matched to post

CREATE POLICY "comments_insert_policy" ON public.post_comments FOR INSERT TO authenticated 
WITH CHECK ( 
  auth.uid() = user_id 
  AND 
  func_can_view_post(post_id) -- Must be able to see post to comment
);

CREATE POLICY "comments_update_policy" ON public.post_comments FOR UPDATE TO authenticated 
USING ( auth.uid() = user_id OR func_can_edit_post(post_id) ); -- Owner or Post Admin

CREATE POLICY "comments_delete_policy" ON public.post_comments FOR DELETE TO authenticated 
USING ( auth.uid() = user_id OR func_can_edit_post(post_id) );


-- 2.7 CONVERSATIONS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;

CREATE POLICY "conversations_select_policy" ON public.conversations FOR SELECT TO authenticated 
USING ( func_is_conversation_member(id, auth.uid()) OR func_is_admin() );

CREATE POLICY "conversations_insert_policy" ON public.conversations FOR INSERT TO authenticated 
WITH CHECK ( true ); -- Start new (usually handled by app logic creating members same time)

CREATE POLICY "conversations_update_policy" ON public.conversations FOR UPDATE TO authenticated 
USING ( func_can_manage_conversation(id) );


-- 2.8 CONVERSATION MEMBERS
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversation_members_select" ON public.conversation_members;
DROP POLICY IF EXISTS "conversation_members_insert" ON public.conversation_members;
DROP POLICY IF EXISTS "conversation_members_update" ON public.conversation_members;
DROP POLICY IF EXISTS "conversation_members_delete" ON public.conversation_members;

CREATE POLICY "conversation_members_select_policy" ON public.conversation_members FOR SELECT TO authenticated 
USING ( func_is_conversation_member(conversation_id, auth.uid()) OR func_is_admin() );

CREATE POLICY "conversation_members_insert_policy" ON public.conversation_members FOR INSERT TO authenticated 
WITH CHECK ( 
    -- Self-join (e.g. via Link/QR) OR Admin adding user
    user_id = auth.uid() 
    OR 
    func_can_manage_conversation(conversation_id)
);

CREATE POLICY "conversation_members_update_policy" ON public.conversation_members FOR UPDATE TO authenticated 
USING ( func_can_manage_conversation(conversation_id) );

CREATE POLICY "conversation_members_delete_policy" ON public.conversation_members FOR DELETE TO authenticated 
USING ( 
  user_id = auth.uid() -- Leave
  OR 
  func_can_manage_conversation(conversation_id) -- Kick
);
