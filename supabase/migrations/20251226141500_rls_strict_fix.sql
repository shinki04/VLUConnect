-- Migration: Strict RLS Hotfix (20251226141500)
-- This specific migration resolves conflicts by CASCADING drops of old functions and policies, 
-- then immediately re-establishing the strict security model.

-- ==============================================================================
-- 0. CLEANUP (Forcefully remove old definitions)
-- ==============================================================================
-- Using CASCADE automatically removes policies that depend on these functions.
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

-- Also ensure strict cleanup of any lingering policies if they weren't caught by CASCADE
-- (Good practice for a "fix" script)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.groups;


-- ==============================================================================
-- 1. HELPER FUNCTIONS (Re-create with optimizations)
-- ==============================================================================

-- 1.1 Global
CREATE OR REPLACE FUNCTION func_is_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND global_role = 'admin');
$$;

-- 1.2 Friendships
CREATE OR REPLACE FUNCTION func_is_friend(target_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.friendships WHERE (requester_id = auth.uid() AND addressee_id = target_id AND status = 'friends') OR (requester_id = target_id AND addressee_id = auth.uid() AND status = 'friends'));
$$;

-- 1.3 Groups
CREATE OR REPLACE FUNCTION func_is_group_member(g_id uuid, u_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = g_id AND user_id = u_id AND status = 'active');
$$;

CREATE OR REPLACE FUNCTION func_is_group_admin(g_id uuid, u_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = g_id AND user_id = u_id AND role IN ('admin', 'sub_admin') AND status = 'active');
$$;

CREATE OR REPLACE FUNCTION func_can_manage_group(g_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT (func_is_admin() OR EXISTS (SELECT 1 FROM public.group_members WHERE group_id = g_id AND user_id = auth.uid() AND role = 'admin' AND status = 'active'));
$$;

CREATE OR REPLACE FUNCTION func_can_view_group(g_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE v_privacy text;
BEGIN
  SELECT privacy_level INTO v_privacy FROM public.groups WHERE id = g_id;
  IF v_privacy = 'public' OR func_is_admin() THEN RETURN TRUE; END IF;
  RETURN func_is_group_member(g_id, auth.uid());
END;
$$;

-- 1.4 Posts
CREATE OR REPLACE FUNCTION func_can_view_post(p_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE v_post RECORD; v_uid uuid := auth.uid();
BEGIN
  SELECT author_id, privacy_level, group_id, moderation_status INTO v_post FROM public.posts WHERE id = p_id;
  IF v_post IS NULL THEN RETURN FALSE; END IF;
  
  -- Admin/Author
  IF func_is_admin() OR v_post.author_id = v_uid THEN RETURN TRUE; END IF;
  
  -- Moderation
  IF v_post.moderation_status <> 'approved' THEN RETURN FALSE; END IF;
  
  -- Group Logic
  IF v_post.group_id IS NOT NULL THEN RETURN func_can_view_group(v_post.group_id); END IF;
  
  -- Privacy
  IF v_post.privacy_level = 'public' THEN RETURN TRUE; END IF;
  IF v_post.privacy_level = 'friends' THEN RETURN func_is_friend(v_post.author_id); END IF;
  
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION func_can_edit_post(p_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.posts WHERE id = p_id AND (author_id = auth.uid() OR func_is_admin()));
$$;

-- 1.5 Conversations
CREATE OR REPLACE FUNCTION func_is_conversation_member(c_id uuid, u_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = c_id AND user_id = u_id);
$$;

CREATE OR REPLACE FUNCTION func_can_manage_conversation(c_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT (func_is_admin() OR EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = c_id AND user_id = auth.uid() AND role IN ('admin', 'sub_admin')));
$$;


-- ==============================================================================
-- 2. APPLY RLS POLICIES
-- ==============================================================================

-- 2.1 Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING ( true );
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING ( id = auth.uid() );

-- 2.2 Friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friendships_select_policy" ON public.friendships FOR SELECT TO authenticated USING ( requester_id = auth.uid() OR addressee_id = auth.uid() );
CREATE POLICY "friendships_insert_policy" ON public.friendships FOR INSERT TO authenticated WITH CHECK ( requester_id = auth.uid() );
CREATE POLICY "friendships_update_policy" ON public.friendships FOR UPDATE TO authenticated USING ( requester_id = auth.uid() OR addressee_id = auth.uid() );

-- 2.3 Groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups_select_policy" ON public.groups FOR SELECT TO authenticated USING ( func_can_view_group(id) );
CREATE POLICY "groups_insert_policy" ON public.groups FOR INSERT TO authenticated WITH CHECK ( true );
CREATE POLICY "groups_update_policy" ON public.groups FOR UPDATE TO authenticated USING ( func_can_manage_group(id) );

-- 2.4 Group Members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group_members_select_policy" ON public.group_members FOR SELECT TO authenticated USING ( func_is_group_member(group_id, auth.uid()) OR func_can_manage_group(group_id) );
CREATE POLICY "group_members_insert_policy" ON public.group_members FOR INSERT TO authenticated WITH CHECK ( user_id = auth.uid() OR func_can_manage_group(group_id) );
CREATE POLICY "group_members_update_policy" ON public.group_members FOR UPDATE TO authenticated USING ( func_can_manage_group(group_id) );
CREATE POLICY "group_members_delete_policy" ON public.group_members FOR DELETE TO authenticated USING ( user_id = auth.uid() OR func_can_manage_group(group_id) );

-- 2.5 Posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select_policy" ON public.posts FOR SELECT TO authenticated USING ( func_can_view_post(id) );
CREATE POLICY "posts_insert_policy" ON public.posts FOR INSERT TO authenticated WITH CHECK ( auth.uid() = author_id );
CREATE POLICY "posts_update_policy" ON public.posts FOR UPDATE TO authenticated USING ( func_can_edit_post(id) );
CREATE POLICY "posts_delete_policy" ON public.posts FOR DELETE TO authenticated USING ( func_can_edit_post(id) );

-- 2.6 Post Comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select_policy" ON public.post_comments FOR SELECT TO authenticated USING ( func_can_view_post(post_id) );
CREATE POLICY "comments_insert_policy" ON public.post_comments FOR INSERT TO authenticated WITH CHECK ( auth.uid() = user_id AND func_can_view_post(post_id) );
CREATE POLICY "comments_update_policy" ON public.post_comments FOR UPDATE TO authenticated USING ( auth.uid() = user_id OR func_can_edit_post(post_id) );
CREATE POLICY "comments_delete_policy" ON public.post_comments FOR DELETE TO authenticated USING ( auth.uid() = user_id OR func_can_edit_post(post_id) );

-- 2.7 Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_select_policy" ON public.conversations FOR SELECT TO authenticated USING ( func_is_conversation_member(id, auth.uid()) OR func_is_admin() );
CREATE POLICY "conversations_insert_policy" ON public.conversations FOR INSERT TO authenticated WITH CHECK ( true );
CREATE POLICY "conversations_update_policy" ON public.conversations FOR UPDATE TO authenticated USING ( func_can_manage_conversation(id) );

-- 2.8 Conversation Members
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversation_members_select_policy" ON public.conversation_members FOR SELECT TO authenticated USING ( func_is_conversation_member(conversation_id, auth.uid()) OR func_is_admin() );
CREATE POLICY "conversation_members_insert_policy" ON public.conversation_members FOR INSERT TO authenticated WITH CHECK ( user_id = auth.uid() OR func_can_manage_conversation(conversation_id) );
CREATE POLICY "conversation_members_update_policy" ON public.conversation_members FOR UPDATE TO authenticated USING ( func_can_manage_conversation(conversation_id) );
CREATE POLICY "conversation_members_delete_policy" ON public.conversation_members FOR DELETE TO authenticated USING ( user_id = auth.uid() OR func_can_manage_conversation(conversation_id) );
