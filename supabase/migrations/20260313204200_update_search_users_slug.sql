DROP FUNCTION IF EXISTS "public"."search_users_with_friendship"(text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION "public"."search_users_with_friendship"("search_query" "text" DEFAULT ''::"text", "role_filter" "text" DEFAULT 'all'::"text", "friend_status_filter" "text" DEFAULT 'all'::"text", "limit_val" integer DEFAULT 20, "offset_val" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "slug" "text", "display_name" "text", "username" "text", "avatar_url" "text", "global_role" "public"."global_roles", "friendship_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  RETURN QUERY
  WITH user_friendships AS (
    SELECT
      CASE
        WHEN requester_id = current_user_id THEN addressee_id
        ELSE requester_id
      END AS friend_id,
      status,
      requester_id
    FROM public.friendships
    WHERE requester_id = current_user_id OR addressee_id = current_user_id
  )
  SELECT
    p.id,
    p.slug,
    p.display_name,
    p.username,
    p.avatar_url,
    p.global_role,
    CASE
      WHEN uf.status = 'friends' THEN 'friends'
      WHEN uf.status = 'pending' AND uf.requester_id = current_user_id THEN 'pending_sent'
      WHEN uf.status = 'pending' AND uf.requester_id = p.id THEN 'pending_received'
      WHEN uf.status = 'blocked' THEN 'blocked'
      ELSE 'none'
    END AS friendship_status
  FROM public.profiles p
  LEFT JOIN user_friendships uf ON p.id = uf.friend_id
  WHERE
    p.id != current_user_id
    -- Don't show blocked users
    AND (uf.status IS NULL OR uf.status != 'blocked')
    -- Text search
    AND (
      NULLIF(search_query, '') IS NULL 
      OR (p.display_name IS NOT NULL AND p.display_name ILIKE '%' || search_query || '%')
      OR (p.username IS NOT NULL AND p.username ILIKE '%' || search_query || '%')
    )
    -- Role filter ('student', 'teacher', etc.)
    AND (
      role_filter = 'all' 
      OR role_filter = p.global_role::text
      -- Optional: Fallback matching for Vietnamese words just in case
      OR (role_filter = 'student' AND p.global_role::text IN ('student', 'sinh_vien', 'sinh viên'))
      OR (role_filter = 'teacher' AND p.global_role::text IN ('teacher', 'giảng viên', 'giang_vien', 'lecturer'))
    )
    -- Friendship status filter
    AND (
      friend_status_filter = 'all'
      OR (
        CASE
          WHEN uf.status = 'friends' THEN 'friends'
          WHEN uf.status = 'pending' AND uf.requester_id = current_user_id THEN 'pending_sent'
          WHEN uf.status = 'pending' AND uf.requester_id = p.id THEN 'pending_received'
          ELSE 'none'
        END = friend_status_filter
      )
    )
  ORDER BY 
    -- Prioritize friends, then pending, then others if no search query
    CASE 
      WHEN search_query = '' AND uf.status = 'friends' THEN 1
      WHEN search_query = '' AND uf.status = 'pending' THEN 2
      ELSE 3
    END ASC,
    p.display_name ASC NULLS LAST, 
    p.username ASC
  LIMIT limit_val OFFSET offset_val;
END;
$$;
