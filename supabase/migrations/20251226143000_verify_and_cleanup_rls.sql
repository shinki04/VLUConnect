-- Migration: Verify and Cleanup Extra RLS Policies (20251226143000)
-- This script uses dynamic SQL to DROP ALL policies on target tables to ensure NO "extra" policies remain.
-- Then it re-applies the strict policies.

DO $$
DECLARE
  r RECORD;
BEGIN
  -- 1. DROP ALL POLICIES for specific tables
  -- We loop through pg_policies to find everything on our target tables and drop them.
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE tablename IN ('profiles', 'friendships', 'groups', 'group_members', 'posts', 'post_comments', 'conversations', 'conversation_members')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Dropped policy: % on table %', r.policyname, r.tablename;
  END LOOP;
  
  -- 2. DROP FUNCTIONS (Cascade) again to be safe
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
  
END $$;

-- ==============================================================================
-- 3. RE-CREATE FUNCTIONS
-- ==============================================================================

-- 3.1 Global
CREATE FUNCTION func_is_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND global_role = 'admin');
$$;

-- 3.2 Friendships
CREATE FUNCTION func_is_friend(target_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.friendships WHERE (requester_id = auth.uid() AND addressee_id = target_id AND status = 'friends') OR (requester_id = target_id AND addressee_id = auth.uid() AND status = 'friends'));
$$;

-- 3.3 Groups
CREATE FUNCTION func_is_group_member(g_id uuid, u_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = g_id AND user_id = u_id AND status = 'active');
$$;

CREATE FUNCTION func_is_group_admin(g_id uuid, u_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = g_id AND user_id = u_id AND role IN ('admin', 'sub_admin') AND status = 'active');
$$;

CREATE FUNCTION func_can_manage_group(g_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT (func_is_admin() OR EXISTS (SELECT 1 FROM public.group_members WHERE group_id = g_id AND user_id = auth.uid() AND role = 'admin' AND status = 'active'));
$$;

CREATE FUNCTION func_can_view_group(g_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE v_privacy text;
BEGIN
  SELECT privacy_level INTO v_privacy FROM public.groups WHERE id = g_id;
  IF v_privacy = 'public' OR func_is_admin() THEN RETURN TRUE; END IF;
  RETURN func_is_group_member(g_id, auth.uid());
END;
$$;

-- 3.4 Posts
CREATE FUNCTION func_can_view_post(p_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
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

CREATE FUNCTION func_can_edit_post(p_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.posts WHERE id = p_id AND (author_id = auth.uid() OR func_is_admin()));
$$;

-- 3.5 Conversations
CREATE FUNCTION func_is_conversation_member(c_id uuid, u_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = c_id AND user_id = u_id);
$$;

CREATE FUNCTION func_can_manage_conversation(c_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT (func_is_admin() OR EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = c_id AND user_id = auth.uid() AND role IN ('admin', 'sub_admin')));
$$;


-- ==============================================================================
-- 4. RE-APPLY RLS POLICIES
-- ==============================================================================

-- 4.1 Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING ( true );
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING ( id = auth.uid() );

-- 4.2 Friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friendships_select_policy" ON public.friendships FOR SELECT TO authenticated USING ( requester_id = auth.uid() OR addressee_id = auth.uid() );
CREATE POLICY "friendships_insert_policy" ON public.friendships FOR INSERT TO authenticated WITH CHECK ( requester_id = auth.uid() );
CREATE POLICY "friendships_update_policy" ON public.friendships FOR UPDATE TO authenticated USING ( requester_id = auth.uid() OR addressee_id = auth.uid() );

-- 4.3 Groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups_select_policy" ON public.groups FOR SELECT TO authenticated USING ( func_can_view_group(id) );
CREATE POLICY "groups_insert_policy" ON public.groups FOR INSERT TO authenticated WITH CHECK ( true );
CREATE POLICY "groups_update_policy" ON public.groups FOR UPDATE TO authenticated USING ( func_can_manage_group(id) );

-- 4.4 Group Members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group_members_select_policy" ON public.group_members FOR SELECT TO authenticated USING ( func_is_group_member(group_id, auth.uid()) OR func_can_manage_group(group_id) );
CREATE POLICY "group_members_insert_policy" ON public.group_members FOR INSERT TO authenticated WITH CHECK ( user_id = auth.uid() OR func_can_manage_group(group_id) );
CREATE POLICY "group_members_update_policy" ON public.group_members FOR UPDATE TO authenticated USING ( func_can_manage_group(group_id) );
CREATE POLICY "group_members_delete_policy" ON public.group_members FOR DELETE TO authenticated USING ( user_id = auth.uid() OR func_can_manage_group(group_id) );

-- 4.5 Posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select_policy" ON public.posts FOR SELECT TO authenticated USING ( func_can_view_post(id) );
CREATE POLICY "posts_insert_policy" ON public.posts FOR INSERT TO authenticated WITH CHECK ( auth.uid() = author_id );
CREATE POLICY "posts_update_policy" ON public.posts FOR UPDATE TO authenticated USING ( func_can_edit_post(id) );
CREATE POLICY "posts_delete_policy" ON public.posts FOR DELETE TO authenticated USING ( func_can_edit_post(id) );

-- 4.6 Post Comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select_policy" ON public.post_comments FOR SELECT TO authenticated USING ( func_can_view_post(post_id) );
CREATE POLICY "comments_insert_policy" ON public.post_comments FOR INSERT TO authenticated WITH CHECK ( auth.uid() = user_id AND func_can_view_post(post_id) );
CREATE POLICY "comments_update_policy" ON public.post_comments FOR UPDATE TO authenticated USING ( auth.uid() = user_id OR func_can_edit_post(post_id) );
CREATE POLICY "comments_delete_policy" ON public.post_comments FOR DELETE TO authenticated USING ( auth.uid() = user_id OR func_can_edit_post(post_id) );

-- 4.7 Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_select_policy" ON public.conversations FOR SELECT TO authenticated USING ( func_is_conversation_member(id, auth.uid()) OR func_is_admin() );
CREATE POLICY "conversations_insert_policy" ON public.conversations FOR INSERT TO authenticated WITH CHECK ( true );
CREATE POLICY "conversations_update_policy" ON public.conversations FOR UPDATE TO authenticated USING ( func_can_manage_conversation(id) );

-- 4.8 Conversation Members
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversation_members_select_policy" ON public.conversation_members FOR SELECT TO authenticated USING ( func_is_conversation_member(conversation_id, auth.uid()) OR func_is_admin() );
CREATE POLICY "conversation_members_insert_policy" ON public.conversation_members FOR INSERT TO authenticated WITH CHECK ( user_id = auth.uid() OR func_can_manage_conversation(conversation_id) );
CREATE POLICY "conversation_members_update_policy" ON public.conversation_members FOR UPDATE TO authenticated USING ( func_can_manage_conversation(conversation_id) );
CREATE POLICY "conversation_members_delete_policy" ON public.conversation_members FOR DELETE TO authenticated USING ( user_id = auth.uid() OR func_can_manage_conversation(conversation_id) );
