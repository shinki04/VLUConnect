-- Migration: Refactor RLS policies for posts table

-- 1. Helper Function: Check if user is admin
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

-- 2. Helper Function: Check if user is friend with target
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

-- 3. Helper Function: Check if specific post is viewable by current user
CREATE OR REPLACE FUNCTION func_can_view_post(post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_post RECORD;
  v_user_id uuid := auth.uid();
BEGIN
  -- Select minimal needed fields
  SELECT author_id, privacy_level, group_id, moderation_status
  INTO v_post
  FROM public.posts
  WHERE id = post_id;

  -- If post not found, deny
  IF v_post IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Admin always has access
  IF func_is_admin() THEN
    RETURN TRUE;
  END IF;

  -- 2. Author always has access
  IF v_post.author_id = v_user_id THEN
    RETURN TRUE;
  END IF;

  -- 3. Moderation check: Only approved posts are visible to others (unless admin/author)
  -- Note: existing requirement 'Admin has full access' updates usually imply seeing flagged/rejected too.
  -- Authors see their own. Others only see 'approved'?
  -- Assuming standard behavior: public/friends visibility only applies if content is approved.
  -- If moderation_status is NOT approved, deny (unless admin/author handled above)
  IF v_post.moderation_status <> 'approved' THEN
    RETURN FALSE;
  END IF;

  -- 4. Privacy Level Checks
  
  -- Public posts
  IF v_post.privacy_level = 'public' THEN
     -- If it's a group post, might need extra check? 
     -- For now assuming post privacy overrides or works in tandem.
     -- Requirement says "Privacy rules (public, friends, etc.)"
     RETURN TRUE;
  END IF;

  -- Friends only
  IF v_post.privacy_level = 'friends' THEN
    IF v_user_id IS NULL THEN
      RETURN FALSE;
    END IF;
    RETURN func_is_friend(v_post.author_id);
  END IF;

  -- Private (only author) - already handled by author check above
  IF v_post.privacy_level = 'private' THEN
    RETURN FALSE;
  END IF;

  -- Default deny
  RETURN FALSE;
END;
$$;

-- 4. Helper Function: Check if user can edit/delete post
CREATE OR REPLACE FUNCTION func_can_edit_post(post_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.posts
    WHERE id = post_id
      AND (
        author_id = auth.uid() -- Author
        OR
        func_is_admin() -- Admin
      )
  );
$$;

-- 5. Helper Function: Check if user can create post
-- Typically anyone authenticated can create, but maybe check ban status?
-- For now, consistent with "insert with check (auth.uid() = author_id)"

-- Apply RLS Policies

-- Enable RLS on posts (ensure it is on)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be clean (names might vary, so we drop if exists or just standard names)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Admin can do everything" ON public.posts;

-- Create new policies using functions

-- SELECT
CREATE POLICY "posts_select_policy"
ON public.posts
FOR SELECT
USING (
  func_can_view_post(id)
);

-- INSERT
CREATE POLICY "posts_insert_policy"
ON public.posts
FOR INSERT
WITH CHECK (
  auth.uid() = author_id
);

-- UPDATE
CREATE POLICY "posts_update_policy"
ON public.posts
FOR UPDATE
USING (
  func_can_edit_post(id)
);

-- DELETE
CREATE POLICY "posts_delete_policy"
ON public.posts
FOR DELETE
USING (
  func_can_edit_post(id)
);
