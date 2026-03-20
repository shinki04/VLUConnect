


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "public"."conversation_type" AS ENUM (
    'direct',
    'group'
);


ALTER TYPE "public"."conversation_type" OWNER TO "postgres";


CREATE TYPE "public"."global_roles" AS ENUM (
    'admin',
    'student',
    'lecturer',
    'moderator',
    'banned'
);


ALTER TYPE "public"."global_roles" OWNER TO "postgres";


CREATE TYPE "public"."group_roles" AS ENUM (
    'admin',
    'sub_admin',
    'moderator',
    'member'
);


ALTER TYPE "public"."group_roles" OWNER TO "postgres";


CREATE TYPE "public"."keyword_match_type" AS ENUM (
    'exact',
    'partial'
);


ALTER TYPE "public"."keyword_match_type" OWNER TO "postgres";


CREATE TYPE "public"."member_status" AS ENUM (
    'active',
    'banned',
    'pending'
);


ALTER TYPE "public"."member_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."member_status" IS 'Status member for group';



CREATE TYPE "public"."message_type" AS ENUM (
    'text',
    'image',
    'file',
    'system'
);


ALTER TYPE "public"."message_type" OWNER TO "postgres";


CREATE TYPE "public"."method_action_target_type" AS ENUM (
    'post',
    'comment',
    'message',
    'group'
);


ALTER TYPE "public"."method_action_target_type" OWNER TO "postgres";


CREATE TYPE "public"."method_action_type" AS ENUM (
    'ai_flagged',
    'keyword_blocked',
    'admin_deleted',
    'user_recalled',
    'admin_flagged'
);


ALTER TYPE "public"."method_action_type" OWNER TO "postgres";


CREATE TYPE "public"."moderation_status" AS ENUM (
    'approved',
    'rejected',
    'flagged',
    'pending'
);


ALTER TYPE "public"."moderation_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."moderation_status" IS 'Trạng thái bài post được duyệt';



CREATE TYPE "public"."notification_type" AS ENUM (
    'follow',
    'friend',
    'like',
    'comment',
    'share',
    'mention',
    'post_reply',
    'system',
    'group',
    'post'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."notification_type" IS 'Enum of notification types: follow, friend, like, comment, share, mention, post_reply';



CREATE TYPE "public"."privacy_group" AS ENUM (
    'public',
    'private',
    'secret'
);


ALTER TYPE "public"."privacy_group" OWNER TO "postgres";


CREATE TYPE "public"."privacy_post" AS ENUM (
    'public',
    'friends',
    'private'
);


ALTER TYPE "public"."privacy_post" OWNER TO "postgres";


CREATE TYPE "public"."queue_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE "public"."queue_status" OWNER TO "postgres";


CREATE TYPE "public"."relationship_status" AS ENUM (
    'pending',
    'friends',
    'blocked',
    'following'
);


ALTER TYPE "public"."relationship_status" OWNER TO "postgres";


CREATE TYPE "public"."report_status" AS ENUM (
    'pending',
    'reviewed',
    'resolved',
    'dismissed'
);


ALTER TYPE "public"."report_status" OWNER TO "postgres";


CREATE TYPE "public"."sql_operation" AS ENUM (
    'SELECT',
    'CREATE',
    'UPDATE',
    'DELETE'
);


ALTER TYPE "public"."sql_operation" OWNER TO "postgres";


CREATE TYPE "public"."status" AS ENUM (
    'todo',
    'success'
);


ALTER TYPE "public"."status" OWNER TO "postgres";


CREATE TYPE "public"."user_status" AS ENUM (
    'online',
    'offline'
);


ALTER TYPE "public"."user_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."are_friends"("p_user_id_1" "uuid", "p_user_id_2" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_is_friends boolean;
BEGIN
  -- Check if both users follow each other
  SELECT EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_id = p_user_id_1 AND following_id = p_user_id_2
  ) AND EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_id = p_user_id_2 AND following_id = p_user_id_1
  ) INTO v_is_friends;
  
  RETURN v_is_friends;
END;
$$;


ALTER FUNCTION "public"."are_friends"("p_user_id_1" "uuid", "p_user_id_2" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."are_friends"("p_user_id_1" "uuid", "p_user_id_2" "uuid") IS 'Check if two users are friends (mutual follows)';



CREATE OR REPLACE FUNCTION "public"."can_view_group_content"("check_group_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_privacy text;
BEGIN
  IF is_admin() THEN RETURN true; END IF;

  SELECT privacy_level INTO v_privacy FROM groups WHERE id = check_group_id;
  
  IF v_privacy = 'public' THEN RETURN true; END IF;
  
  IF is_group_member(check_group_id) THEN RETURN true; END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."can_view_group_content"("check_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_post"("post_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$DECLARE
  v_post RECORD;
  v_uid uuid := auth.uid();
BEGIN
  SELECT author_id, privacy_level, group_id, moderation_status, is_deleted
  INTO v_post
  FROM public.posts
  WHERE id = p_id;

  IF v_post IS NULL OR v_post.is_deleted THEN
    RETURN FALSE;
  END IF;

  -- Admin / Author luôn được xem
  IF func_is_admin() OR v_post.author_id = v_uid THEN
    RETURN TRUE;
  END IF;

  -- Chưa duyệt thì cút (trừ admin/author)
  IF v_post.moderation_status <> 'approved' THEN
    RETURN FALSE;
  END IF;

  -- ===== POST TRONG GROUP =====
  IF v_post.group_id IS NOT NULL THEN
    RETURN func_can_view_group(v_post.group_id);
  END IF;

  -- ===== POST CÁ NHÂN (NO GROUP) =====
  IF v_post.privacy_level = 'public' THEN
    RETURN TRUE;
  END IF;

  IF v_post.privacy_level = 'friends' THEN
    RETURN func_is_friend(v_post.author_id);
  END IF;

  -- private / only_me
  RETURN FALSE;
END;$$;


ALTER FUNCTION "public"."can_view_post"("post_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_global_min_role"("min_role" "public"."global_roles") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      global_role = 'admin'
      OR (min_role = 'moderator' AND global_role = 'moderator')
      OR (min_role = 'lecturer' AND global_role IN ('moderator', 'lecturer'))
      OR (min_role = 'student') -- everyone has at least student basically, but usually for strict checks
    )
  );
END;
$$;


ALTER FUNCTION "public"."check_global_min_role"("min_role" "public"."global_roles") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_group_min_role"("group_id" "uuid", "min_role" "public"."group_roles") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Global admins/mods always have access
  IF check_global_min_role('moderator') THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = check_group_min_role.group_id
    AND group_members.user_id = auth.uid()
    AND (
      role = 'admin'
      OR (min_role = 'sub_admin' AND role = 'sub_admin')
      OR (min_role = 'moderator' AND role IN ('sub_admin', 'moderator'))
      OR (min_role = 'member')
    )
  );
END;
$$;


ALTER FUNCTION "public"."check_group_min_role"("group_id" "uuid", "min_role" "public"."group_roles") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_sender_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text" DEFAULT NULL::"text", "p_entity_type" "text" DEFAULT NULL::"text", "p_entity_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Don't create notification if sender is same as recipient
  IF p_sender_id = p_recipient_id THEN
    RETURN NULL;
  END IF;
  
  -- Create notification
  INSERT INTO public.notifications (
    recipient_id,
    sender_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_recipient_id,
    p_sender_id,
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_sender_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_sender_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") IS 'Creates a new notification for a user';



CREATE OR REPLACE FUNCTION "public"."decrement_hashtag_count"("hashtag_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE hashtags
  SET post_count = GREATEST(0, post_count - 1)
  WHERE id = hashtag_id;
END;
$$;


ALTER FUNCTION "public"."decrement_hashtag_count"("hashtag_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."func_can_edit_post"("p_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.posts WHERE id = p_id AND (author_id = auth.uid() OR func_is_admin()));
$$;


ALTER FUNCTION "public"."func_can_edit_post"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."func_can_manage_conversation"("c_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."func_can_manage_conversation"("c_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."func_can_manage_group"("g_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT (func_is_admin() OR EXISTS (SELECT 1 FROM public.group_members WHERE group_id = g_id AND user_id = auth.uid() AND role = 'admin' AND status = 'active'));
$$;


ALTER FUNCTION "public"."func_can_manage_group"("g_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."func_can_moderate_conversation"("c_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."func_can_moderate_conversation"("c_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."func_can_view_group"("g_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE v_privacy text;
BEGIN
  SELECT privacy_level INTO v_privacy FROM public.groups WHERE id = g_id;
  IF v_privacy = 'public' OR func_is_admin() THEN RETURN TRUE; END IF;
  RETURN func_is_group_member(g_id, auth.uid());
END;
$$;


ALTER FUNCTION "public"."func_can_view_group"("g_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."func_can_view_post"("p_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."func_can_view_post"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."func_is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND global_role = 'admin');
$$;


ALTER FUNCTION "public"."func_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."func_is_conversation_member"("c_id" "uuid", "u_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_members 
    WHERE conversation_id = c_id AND user_id = u_id
  );
$$;


ALTER FUNCTION "public"."func_is_conversation_member"("c_id" "uuid", "u_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."func_is_friend"("target_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.friendships WHERE (requester_id = auth.uid() AND addressee_id = target_id AND status = 'friends') OR (requester_id = target_id AND addressee_id = auth.uid() AND status = 'friends'));
$$;


ALTER FUNCTION "public"."func_is_friend"("target_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."func_is_group_admin"("g_id" "uuid", "u_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = g_id AND user_id = u_id AND role IN ('admin', 'sub_admin') AND status = 'active');
$$;


ALTER FUNCTION "public"."func_is_group_admin"("g_id" "uuid", "u_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."func_is_group_member"("g_id" "uuid", "u_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = g_id AND user_id = u_id AND status = 'active');
$$;


ALTER FUNCTION "public"."func_is_group_member"("g_id" "uuid", "u_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."func_is_lecture"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
        AND global_role = 'lecturer'
    );
END;
$$;


ALTER FUNCTION "public"."func_is_lecture"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_comment_count"("p_post_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer
  FROM public.post_comments
  WHERE post_id = p_post_id
  INTO v_count;
  
  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_comment_count"("p_post_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_comment_count"("p_post_id" "uuid") IS 'Get total comments for a post';



CREATE OR REPLACE FUNCTION "public"."get_conversations_with_details"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "name" "text", "avatar_url" "text", "type" "text", "last_message_at" timestamp with time zone, "members" "jsonb", "lastMessage" "jsonb", "unreadCount" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  WITH user_convs AS (
    -- Get user conversations and last_read_at
    SELECT cm.conversation_id, cm.last_read_at
    FROM conversation_members cm
    WHERE cm.user_id = p_user_id
  ),
  conv_members_agg AS (
    -- Aggregate members and their profiles
    SELECT 
      cm.conversation_id,
      jsonb_agg(
        jsonb_build_object(
          'user_id', cm.user_id,
          'conversation_id', cm.conversation_id,
          'joined_at', cm.joined_at,
          'role', cm.role,
          'last_read_at', cm.last_read_at,
          'profile', to_jsonb(p.*)
        )
      ) as members
    FROM conversation_members cm
    JOIN profiles p ON cm.user_id = p.id
    WHERE cm.conversation_id IN (SELECT conversation_id FROM user_convs)
    GROUP BY cm.conversation_id
  ),
  last_msgs AS (
    -- Get last message (not deleted)
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      (to_jsonb(m.*) || jsonb_build_object('sender', to_jsonb(p.*))) as message_data
    FROM messages m
    LEFT JOIN profiles p ON m.sender_id = p.id
    WHERE m.conversation_id IN (SELECT conversation_id FROM user_convs)
    AND m.is_deleted = false
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  unread_counts AS (
    -- Count unread messages
    SELECT
      m.conversation_id,
      COUNT(*) as count
    FROM messages m
    JOIN user_convs uc ON m.conversation_id = uc.conversation_id
    WHERE m.conversation_id IN (SELECT conversation_id FROM user_convs)
    AND m.sender_id != p_user_id
    AND m.is_deleted = false
    AND (uc.last_read_at IS NULL OR m.created_at > uc.last_read_at)
    GROUP BY m.conversation_id
  )
  SELECT 
    c.id,
    c.created_at,
    c.updated_at,
    c.name,
    c.avatar_url,
    c.type::text, -- Cast ENUM to TEXT
    c.last_message_at,
    COALESCE(cma.members, '[]'::jsonb),
    lm.message_data,
    COALESCE(uc.count, 0)
  FROM conversations c
  JOIN user_convs ucv ON c.id = ucv.conversation_id
  LEFT JOIN conv_members_agg cma ON c.id = cma.conversation_id
  LEFT JOIN last_msgs lm ON c.id = lm.conversation_id
  LEFT JOIN unread_counts uc ON c.id = uc.conversation_id
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;


ALTER FUNCTION "public"."get_conversations_with_details"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_posts"("p_filter" "text" DEFAULT 'all'::"text") RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "author" "jsonb", "content" "text", "media_urls" "text"[], "updated_at" timestamp with time zone, "like_count" integer, "comment_count" integer, "share_count" integer, "privacy_level" "text", "is_anonymous" boolean, "group_id" "uuid", "group" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$DECLARE
    v_user_id uuid := auth.uid();
    v_is_admin boolean := func_is_admin();
    v_is_lecture boolean := func_is_lecture();
BEGIN

    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.created_at,

        jsonb_build_object(
            'id', pr.id,
            'username', pr.username,
            'slug', pr.slug,
            'display_name', pr.display_name,
            'avatar_url', pr.avatar_url,
            'global_role', pr.global_role
        ),

        p.content,

        COALESCE(p.media_urls, ARRAY[]::text[]),

        p.updated_at,

        COALESCE(p.like_count,0),
        COALESCE(p.comment_count,0),
        COALESCE(p.share_count,0),

        p.privacy_level::text,

        COALESCE(p.is_anonymous,false),

        p.group_id,

        CASE
            WHEN p.group_id IS NOT NULL THEN
                jsonb_build_object(
                    'id', g.id,
                    'name', g.name,
                    'slug', g.slug,
                    'allow_anonymous_comments', COALESCE(g.allow_anonymous_comments, false),
                    'allow_anonymous_posts', COALESCE(g.allow_anonymous_posts, false)
                )
            ELSE NULL::jsonb
        END

    FROM posts p
    JOIN profiles pr ON pr.id = p.author_id
    LEFT JOIN groups g ON g.id = p.group_id

    WHERE

        -- not deleted
        COALESCE(p.is_deleted,false) = false

        -- moderation
        AND (
            p.moderation_status IS NULL
            OR p.moderation_status IN ('approved','flagged')
        )

        AND (

            -- admin/lecture see everything
            v_is_admin
            OR v_is_lecture

            -- own post
            OR p.author_id = v_user_id

            -- public
            OR p.privacy_level = 'public'

            -- friends
            OR (
                p.privacy_level = 'friends'
                AND p.group_id IS NULL
                AND EXISTS (
                    SELECT 1
                    FROM friendships f
                    WHERE f.status = 'friends'
                    AND (
                        (f.requester_id = v_user_id AND f.addressee_id = p.author_id)
                        OR
                        (f.requester_id = p.author_id AND f.addressee_id = v_user_id)
                    )
                )
            )

            -- group post
            OR (
                p.group_id IS NOT NULL
                AND EXISTS (
                    SELECT 1
                    FROM group_members gm
                    WHERE gm.group_id = p.group_id
                    AND gm.user_id = v_user_id
                    AND gm.status = 'active'
                )
            )
        )

        AND (
            p_filter = 'all'
            OR (p_filter = 'user' AND p.group_id IS NULL)
            OR (p_filter = 'group' AND p.group_id IS NOT NULL)
        )

    ORDER BY p.created_at DESC;

END;$$;


ALTER FUNCTION "public"."get_dashboard_posts"("p_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_follower_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer
  FROM public.follows
  WHERE following_id = p_user_id
  INTO v_count;
  
  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_follower_count"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_follower_count"("p_user_id" "uuid") IS 'Get number of followers for a user';



CREATE OR REPLACE FUNCTION "public"."get_following_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer
  FROM public.follows
  WHERE follower_id = p_user_id
  INTO v_count;
  
  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_following_count"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_following_count"("p_user_id" "uuid") IS 'Get number of users that user follows';



CREATE OR REPLACE FUNCTION "public"."get_friend_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer
  FROM public.friends
  WHERE user_id_1 = p_user_id OR user_id_2 = p_user_id
  INTO v_count;
  
  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_friend_count"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_friend_count"("p_user_id" "uuid") IS 'Get number of friends (mutual follows) for a user';



CREATE OR REPLACE FUNCTION "public"."get_post_like_count"("p_post_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer
  FROM public.post_likes
  WHERE post_id = p_post_id
  INTO v_count;
  
  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_post_like_count"("p_post_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_post_like_count"("p_post_id" "uuid") IS 'Get total likes for a post';



CREATE OR REPLACE FUNCTION "public"."get_reply_count"("p_comment_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer
  FROM public.post_comments
  WHERE parent_id = p_comment_id
  INTO v_count;
  
  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_reply_count"("p_comment_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_reply_count"("p_comment_id" "uuid") IS 'Get total replies for a comment';



CREATE OR REPLACE FUNCTION "public"."get_share_count"("p_post_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer
  FROM public.post_shares
  WHERE post_id = p_post_id
  INTO v_count;
  
  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_share_count"("p_post_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_share_count"("p_post_id" "uuid") IS 'Get total shares for a post';



CREATE OR REPLACE FUNCTION "public"."get_task_stats"() RETURNS "void"
    LANGUAGE "sql"
    AS $_$create or replace function get_task_stats(
  status_filter text,
  date_filter text
)
returns json as $$
declare
  start_time timestamptz;
  end_time timestamptz;
  total int;
  todo_count int;
  success_count int;
begin
  -- 1️⃣ Tính khoảng thời gian theo date_filter
  if date_filter = 'today' then
    start_time := date_trunc('day', now());
    end_time := now();
  elsif date_filter = 'week' then
    start_time := date_trunc('week', now());
    end_time := now();
  elsif date_filter = 'month' then
    start_time := date_trunc('month', now());
    end_time := now();
  else
    start_time := '1970-01-01';
    end_time := now();
  end if;

  -- 2️⃣ Đếm tổng tasks theo filter
  select count(*) into total
  from tasks
  where (status_filter = 'all' or status = status_filter)
    and created_at between start_time and end_time;

  -- 3️⃣ Đếm todo
  select count(*) into todo_count
  from tasks
  where status = 'todo'
    and (status_filter = 'all' or status = status_filter)
    and created_at between start_time and end_time;

  -- 4️⃣ Đếm success
  select count(*) into success_count
  from tasks
  where status = 'success'
    and (status_filter = 'all' or status = status_filter)
    and created_at between start_time and end_time;

  -- 5️⃣ Trả JSON về JS
  return json_build_object(
    'total', total,
    'todo', todo_count,
    'success', success_count
  );
end;
$$ language plpgsql security definer;$_$;


ALTER FUNCTION "public"."get_task_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer
  FROM public.notifications
  WHERE recipient_id = p_user_id
    AND is_read = FALSE
  INTO v_count;
  
  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_unread_count"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_unread_count"("p_user_id" "uuid") IS 'Gets count of unread notifications for a user';



CREATE OR REPLACE FUNCTION "public"."get_user_friends"("p_user_id" "uuid") RETURNS TABLE("friend_id" "uuid", "friends_since" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.user_id_1 = p_user_id THEN f.user_id_2
      ELSE f.user_id_1
    END AS friend_id,
    f.friends_since
  FROM public.friends f
  WHERE f.user_id_1 = p_user_id OR f.user_id_2 = p_user_id
  ORDER BY f.friends_since DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_friends"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_friends"("p_user_id" "uuid") IS 'Get all friends for a user with friendship date';



CREATE OR REPLACE FUNCTION "public"."handle_new_comment_like"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_comment_author_id UUID;
  v_post_id UUID;
BEGIN
  SELECT user_id, post_id INTO v_comment_author_id, v_post_id
  FROM public.post_comments
  WHERE id = NEW.comment_id;

  IF v_comment_author_id != NEW.user_id THEN
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      type,
      entity_type,
      entity_id,
      title,
      message,
      metadata
    ) VALUES (
      v_comment_author_id,
      NEW.user_id,
      'like',
      'comment',
      NEW.comment_id,
      'Thích bình luận',
      'đã thích bình luận của bạn.',
      jsonb_build_object('post_id', v_post_id, 'comment_id', NEW.comment_id)
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_comment_like"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_post_comment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update public.posts set comment_count = coalesce(comment_count, 0) + 1 where id = new.post_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_post_comment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_post_like"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_post_author uuid;
  v_sender_name text;
begin
  update public.posts set like_count = coalesce(like_count, 0) + 1 where id = new.post_id
  RETURNING author_id INTO v_post_author;
  
  IF v_post_author != new.user_id THEN
      SELECT display_name INTO v_sender_name FROM profiles WHERE id = new.user_id;
      
      INSERT INTO notifications (recipient_id, sender_id, type, entity_type, entity_id, title, message)
      VALUES (
          v_post_author,
          new.user_id,
          'like',
          'post_like',
          new.post_id,
          'Có người thích bài viết của bạn',
          COALESCE(v_sender_name, 'Ai đó') || ' đã thích bài viết của bạn'
      );
  END IF;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_post_like"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_post_share"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update public.posts set share_count = coalesce(share_count, 0) + 1 where id = new.post_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_post_share"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  assigned_role public.global_roles;
  base_username text;
  new_username text;
  counter integer := 1;
BEGIN
  IF new.email LIKE '%@vlu.edu.vn' THEN
    assigned_role := 'lecturer'::public.global_roles;
  ELSIF new.email LIKE '%@vanlanguni.vn' THEN
    assigned_role := 'student'::public.global_roles;
  ELSE
    RAISE EXCEPTION 'Chỉ cho phép tài khoản email @vlu.edu.vn hoặc @vanlanguni.vn';
  END IF;

  -- Use full_name directly as the preferred base username per user request
  base_username := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  new_username := base_username;
  
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
    new_username := base_username || counter::text;
    counter := counter + 1;
  END LOOP;

  INSERT INTO public.profiles (id, display_name, email, global_role, username)
  VALUES (
    new.id, 
    base_username, 
    new.email, 
    assigned_role,
    new_username
  );
  
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_post_comment_deleted"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update public.posts set comment_count = greatest(coalesce(comment_count, 0) - 1, 0) where id = old.post_id;
  return old;
end;
$$;


ALTER FUNCTION "public"."handle_post_comment_deleted"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_post_unlike"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update public.posts set like_count = greatest(coalesce(like_count, 0) - 1, 0) where id = old.post_id;
  return old;
end;
$$;


ALTER FUNCTION "public"."handle_post_unlike"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_user_liked_post"("p_post_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_liked boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.post_likes
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO v_liked;
  
  RETURN v_liked;
END;
$$;


ALTER FUNCTION "public"."has_user_liked_post"("p_post_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_user_liked_post"("p_post_id" "uuid", "p_user_id" "uuid") IS 'Check if user has liked a post';



CREATE OR REPLACE FUNCTION "public"."increment_hashtag_count"("hashtag_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE hashtags 
  SET post_count = post_count + 1 
  WHERE id = hashtag_id;
END;
$$;


ALTER FUNCTION "public"."increment_hashtag_count"("hashtag_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND global_role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_following"("p_follower_id" "uuid", "p_following_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_is_following boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
  ) INTO v_is_following;
  
  RETURN v_is_following;
END;
$$;


ALTER FUNCTION "public"."is_following"("p_follower_id" "uuid", "p_following_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_following"("p_follower_id" "uuid", "p_following_id" "uuid") IS 'Check if user1 follows user2';



CREATE OR REPLACE FUNCTION "public"."is_friend"("target_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'friends' 
    AND (
      (requester_id = (select auth.uid()) AND addressee_id = target_id)
      OR 
      (requester_id = target_id AND addressee_id = (select auth.uid()))
    )
  );
$$;


ALTER FUNCTION "public"."is_friend"("target_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_admin"("_group_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = _group_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
  );
END;
$$;


ALTER FUNCTION "public"."is_group_admin"("_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_manager"("check_group_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = check_group_id 
      AND user_id = (select auth.uid()) 
      AND status = 'active'
      AND role IN ('admin', 'sub_admin', 'moderator')
  );
$$;


ALTER FUNCTION "public"."is_group_manager"("check_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_member"("check_group_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = check_group_id AND user_id = (select auth.uid()) AND status = 'active'
  );
$$;


ALTER FUNCTION "public"."is_group_member"("check_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE recipient_id = p_user_id
    AND is_read = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") IS 'Marks all notifications as read for a user';



CREATE OR REPLACE FUNCTION "public"."mark_conversation_as_read"("conversation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
BEGIN
  UPDATE public.conversation_members
  SET last_read_at = now()
  WHERE 
    conversation_members.conversation_id = mark_conversation_as_read.conversation_id
    AND conversation_members.user_id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."mark_conversation_as_read"("conversation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_updated boolean;
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE id = p_notification_id
    AND recipient_id = auth.uid()
    AND is_read = FALSE;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;


ALTER FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") IS 'Marks a single notification as read';



CREATE OR REPLACE FUNCTION "public"."notify_friend_request"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    sender_name TEXT;
BEGIN
    -- Lấy tên người gửi
    SELECT display_name INTO sender_name 
    FROM profiles WHERE id = NEW.requester_id;
    
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        -- Gửi notification cho người nhận lời mời
        INSERT INTO notifications (recipient_id, sender_id, type, title, message, entity_id, entity_type)
        VALUES (
            NEW.addressee_id,
            NEW.requester_id,
            'friend',
            'Lời mời kết bạn',
            COALESCE(sender_name, 'Ai đó') || ' đã gửi lời mời kết bạn cho bạn',
            NEW.id,
            'friendship'
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'friends' THEN
        -- Gửi notification cho người gửi lời mời (đã được chấp nhận)
        SELECT display_name INTO sender_name 
        FROM profiles WHERE id = NEW.addressee_id;
        
        INSERT INTO notifications (recipient_id, sender_id, type, title, message, entity_id, entity_type)
        VALUES (
            NEW.requester_id,
            NEW.addressee_id,
            'friend',
            'Đã chấp nhận kết bạn',
            COALESCE(sender_name, 'Ai đó') || ' đã chấp nhận lời mời kết bạn của bạn',
            NEW.id,
            'friendship'
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_friend_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_group_join"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_group_name text;
begin
  IF (TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active') OR (TG_OP = 'INSERT' AND NEW.status = 'active') THEN
      SELECT name INTO v_group_name FROM groups WHERE id = NEW.group_id;
      
      INSERT INTO notifications (recipient_id, sender_id, type, entity_type, entity_id, title, message)
      VALUES (
          NEW.user_id,
          NULL,
          'group',
          'group_join',
          NEW.group_id,
          'Tham gia nhóm thành công',
          'Bạn đã trở thành thành viên của nhóm ' || COALESCE(v_group_name, '')
      );
  END IF;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."notify_group_join"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_comment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_post_author uuid;
  v_sender_name text;
begin
  SELECT author_id INTO v_post_author FROM posts WHERE id = NEW.post_id;
  
  IF v_post_author != NEW.user_id THEN
      SELECT display_name INTO v_sender_name FROM profiles WHERE id = NEW.user_id;
      
      INSERT INTO notifications (recipient_id, sender_id, type, entity_type, entity_id, title, message)
      VALUES (
          v_post_author,
          NEW.user_id,
          'comment',
          'post_comment',
          NEW.post_id,
          'Có người bình luận bài viết của bạn',
          COALESCE(v_sender_name, 'Ai đó') || ' đã bình luận: ' || left(NEW.content, 50)
      );
  END IF;

  return NEW;
end;
$$;


ALTER FUNCTION "public"."notify_new_comment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_on_follow"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_follower_name TEXT;
  v_are_friends BOOLEAN;
BEGIN
  -- Get follower's display name
  SELECT COALESCE(display_name, username, 'Someone')
  INTO v_follower_name
  FROM auth.users
  WHERE id = NEW.follower_id;
  
  -- Check if they're now friends
  SELECT public.are_friends(NEW.follower_id, NEW.following_id)
  INTO v_are_friends;
  
  -- Create follow notification
  PERFORM public.create_notification(
    p_recipient_id := NEW.following_id,
    p_sender_id := NEW.follower_id,
    p_type := 'follow'::notification_type,
    p_title := v_follower_name || ' started following you',
    p_entity_type := 'follow',
    p_entity_id := NEW.id,
    p_metadata := jsonb_build_object('is_friend', v_are_friends)
  );
  
  -- If they're now friends, create friend notification for the follower
  IF v_are_friends THEN
    DECLARE
      v_following_name TEXT;
    BEGIN
      SELECT COALESCE(display_name, username, 'Someone')
      INTO v_following_name
      FROM auth.users
      WHERE id = NEW.following_id;
      
      PERFORM public.create_notification(
        p_recipient_id := NEW.follower_id,
        p_sender_id := NEW.following_id,
        p_type := 'friend'::notification_type,
        p_title := 'You and ' || v_following_name || ' are now friends!',
        p_entity_type := 'friend',
        p_entity_id := NEW.id
      );
    END;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_on_follow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_post_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF OLD.moderation_status IS DISTINCT FROM NEW.moderation_status AND NEW.moderation_status IN ('approved', 'rejected') THEN
        INSERT INTO notifications (recipient_id, sender_id, type, entity_type, entity_id, title, message)
        VALUES (
            NEW.author_id,
            auth.uid(),
            'system',
            'post',
            NEW.id,
            CASE WHEN NEW.moderation_status = 'approved' THEN 'Bài viết đã được duyệt' ELSE 'Bài viết bị từ chối' END,
            CASE WHEN NEW.moderation_status = 'approved' THEN 'Bài viết của bạn đã được quản trị viên duyệt.' ELSE 'Bài viết của bạn đã bị quản trị viên từ chối.' END
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_post_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_role_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  IF OLD.global_role IS DISTINCT FROM NEW.global_role THEN
      INSERT INTO notifications (recipient_id, sender_id, type, entity_type, entity_id, title, message)
      VALUES (
          NEW.id,
          auth.uid(),
          'system',
          'role_change',
          NEW.id,
          'Vai trò của bạn đã thay đổi',
          'Vai trò của bạn trên hệ thống đã được cập nhật thành: ' || NEW.global_role
      );
  END IF;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."notify_role_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_engagement_stats"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.post_engagement_stats;
END;
$$;


ALTER FUNCTION "public"."refresh_engagement_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_engagement_stats"() IS 'Refreshes the engagement stats materialized view';



CREATE OR REPLACE FUNCTION "public"."refresh_friends_view"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.friends;
END;
$$;


ALTER FUNCTION "public"."refresh_friends_view"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_friends_view"() IS 'Refreshes the friends materialized view';



CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."search_users_with_friendship"("search_query" "text", "role_filter" "text", "friend_status_filter" "text", "limit_val" integer, "offset_val" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."share_post"("p_post_id" "uuid", "p_user_id" "uuid", "p_caption" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_share_id UUID;
BEGIN
  INSERT INTO public.post_shares (post_id, user_id, caption)
  VALUES (p_post_id, p_user_id, p_caption)
  RETURNING id INTO v_share_id;
  
  RETURN v_share_id;
END;
$$;


ALTER FUNCTION "public"."share_post"("p_post_id" "uuid", "p_user_id" "uuid", "p_caption" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."share_post"("p_post_id" "uuid", "p_user_id" "uuid", "p_caption" "text") IS 'Share a post with optional caption';



CREATE OR REPLACE FUNCTION "public"."sync_role_to_jwt"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update auth.users
  set raw_app_meta_data =
    jsonb_set(
      coalesce(raw_app_meta_data, '{}'::jsonb),
      '{global_role}',
      to_jsonb(new.global_role)
    )
  where id = new.id;

  return new;
end;
$$;


ALTER FUNCTION "public"."sync_role_to_jwt"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_comment_like"("p_comment_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_liked boolean;
BEGIN
  -- Check if already liked
  SELECT EXISTS (
    SELECT 1 FROM public.comment_likes
    WHERE comment_id = p_comment_id AND user_id = p_user_id
  ) INTO v_liked;
  
  IF v_liked THEN
    -- Unlike
    DELETE FROM public.comment_likes
    WHERE comment_id = p_comment_id AND user_id = p_user_id;
    RETURN false;
  ELSE
    -- Like
    INSERT INTO public.comment_likes (comment_id, user_id)
    VALUES (p_comment_id, p_user_id);
    RETURN true;
  END IF;
END;
$$;


ALTER FUNCTION "public"."toggle_comment_like"("p_comment_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."toggle_comment_like"("p_comment_id" "uuid", "p_user_id" "uuid") IS 'Toggle like on a comment';



CREATE OR REPLACE FUNCTION "public"."toggle_post_like"("p_post_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_liked boolean;
BEGIN
  -- Check if already liked
  SELECT EXISTS (
    SELECT 1 FROM public.post_likes
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO v_liked;
  
  IF v_liked THEN
    -- Unlike
    DELETE FROM public.post_likes
    WHERE post_id = p_post_id AND user_id = p_user_id;
    RETURN false;
  ELSE
    -- Like
    INSERT INTO public.post_likes (post_id, user_id)
    VALUES (p_post_id, p_user_id);
    RETURN true;
  END IF;
END;
$$;


ALTER FUNCTION "public"."toggle_post_like"("p_post_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."toggle_post_like"("p_post_id" "uuid", "p_user_id" "uuid") IS 'Toggle like on a post';



CREATE OR REPLACE FUNCTION "public"."track_post_view"("p_post_id" "uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_inserted boolean;
BEGIN
  -- Try to insert, ignore if already exists
  INSERT INTO public.post_views (post_id, user_id, ip_address, user_agent)
  VALUES (p_post_id, p_user_id, p_ip_address, p_user_agent)
  ON CONFLICT (post_id, user_id) DO NOTHING;
  
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted > 0;
END;
$$;


ALTER FUNCTION "public"."track_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."track_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text") IS 'Atomically tracks a post view, preventing duplicates';



CREATE OR REPLACE FUNCTION "public"."trigger_refresh_friends"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Refresh in background (non-blocking)
  PERFORM public.refresh_friends_view();
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_refresh_friends"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update post comment count
    UPDATE public.posts
    SET comment_count = COALESCE(comment_count, 0) + 1
    WHERE id = NEW.post_id;
    
    -- Update parent comment reply count
    IF NEW.parent_id IS NOT NULL THEN
      UPDATE public.post_comments
      SET reply_count = COALESCE(reply_count, 0) + 1
      WHERE id = NEW.parent_id;
    END IF;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Update post comment count
    UPDATE public.posts
    SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
    
    -- Update parent comment reply count
    IF OLD.parent_id IS NOT NULL THEN
      UPDATE public.post_comments
      SET reply_count = GREATEST(COALESCE(reply_count, 0) - 1, 0)
      WHERE id = OLD.parent_id;
    END IF;
    
    RETURN OLD;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_comment_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_like_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.post_comments
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.post_comments
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_comment_like_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_comment_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_friend_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'friends' THEN
        UPDATE profiles SET friend_count = friend_count + 1 
        WHERE id IN (NEW.requester_id, NEW.addressee_id);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'friends' AND NEW.status = 'friends' THEN
            UPDATE profiles SET friend_count = friend_count + 1 
            WHERE id IN (NEW.requester_id, NEW.addressee_id);
        ELSIF OLD.status = 'friends' AND NEW.status != 'friends' THEN
            UPDATE profiles SET friend_count = friend_count - 1 
            WHERE id IN (NEW.requester_id, NEW.addressee_id);
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'friends' THEN
        UPDATE profiles SET friend_count = friend_count - 1 
        WHERE id IN (OLD.requester_id, OLD.addressee_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_friend_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_like_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_post_like_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_share_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET share_count = COALESCE(share_count, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET share_count = GREATEST(COALESCE(share_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_post_share_count"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_analysis_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "model_name" "text" NOT NULL,
    "analysis_type" "text" NOT NULL,
    "label" "text" NOT NULL,
    "score" double precision NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_analysis_logs_target_type_check" CHECK (("target_type" = ANY (ARRAY['post'::"text", 'comment'::"text", 'review'::"text", 'message'::"text"])))
);


ALTER TABLE "public"."ai_analysis_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blocked_keywords" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "keyword" "text" NOT NULL,
    "match_type" "public"."keyword_match_type" DEFAULT 'partial'::"public"."keyword_match_type" NOT NULL,
    "scope" "text" DEFAULT 'global'::"text" NOT NULL,
    "group_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "blocked_keywords_group_id_check" CHECK (((("scope" = 'global'::"text") AND ("group_id" IS NULL)) OR (("scope" = 'group'::"text") AND ("group_id" IS NOT NULL)))),
    CONSTRAINT "blocked_keywords_scope_check" CHECK (("scope" = ANY (ARRAY['global'::"text", 'group'::"text"])))
);


ALTER TABLE "public"."blocked_keywords" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comment_likes" OWNER TO "postgres";


COMMENT ON TABLE "public"."comment_likes" IS 'Stores likes on comments';



CREATE TABLE IF NOT EXISTS "public"."conversation_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "last_read_at" timestamp with time zone,
    "is_muted" boolean DEFAULT false
);


ALTER TABLE "public"."conversation_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."conversation_type" DEFAULT 'direct'::"public"."conversation_type" NOT NULL,
    "name" "text",
    "avatar_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_message_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friendships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "addressee_id" "uuid" NOT NULL,
    "status" "public"."relationship_status" DEFAULT 'pending'::"public"."relationship_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "no_self_friendship" CHECK (("requester_id" <> "addressee_id"))
);


ALTER TABLE "public"."friendships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."group_roles" DEFAULT 'member'::"public"."group_roles" NOT NULL,
    "status" "public"."member_status" DEFAULT 'pending'::"public"."member_status" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "avatar_url" "text",
    "cover_url" "text",
    "privacy_level" "text" DEFAULT 'public'::"text",
    "membership_mode" "text" DEFAULT 'auto'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "allow_anonymous_posts" boolean DEFAULT false,
    "allow_anonymous_comments" boolean DEFAULT false,
    CONSTRAINT "groups_membership_mode_check" CHECK (("membership_mode" = ANY (ARRAY['auto'::"text", 'request'::"text"]))),
    CONSTRAINT "groups_privacy_level_check" CHECK (("privacy_level" = ANY (ARRAY['public'::"text", 'private'::"text"])))
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


COMMENT ON COLUMN "public"."groups"."allow_anonymous_posts" IS 'If true, members can post anonymously in this group';



COMMENT ON COLUMN "public"."groups"."allow_anonymous_comments" IS 'If true, members can comment anonymously in this group';



CREATE TABLE IF NOT EXISTS "public"."hashtags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "post_count" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."hashtags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid",
    "content" "text" NOT NULL,
    "message_type" "public"."message_type" DEFAULT 'text'::"public"."message_type",
    "media_urls" "text"[],
    "is_edited" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone,
    "reply_to_id" "uuid"
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moderation_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "action_type" "public"."method_action_type" NOT NULL,
    "reason" "text" NOT NULL,
    "matched_keyword" "text",
    "ai_score" double precision,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."moderation_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "sender_id" "uuid",
    "type" "public"."notification_type" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "title" "text" NOT NULL,
    "message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_entity" CHECK (((("entity_type" IS NULL) AND ("entity_id" IS NULL)) OR (("entity_type" IS NOT NULL) AND ("entity_id" IS NOT NULL))))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Stores user notifications for all social interactions';



CREATE TABLE IF NOT EXISTS "public"."post_appeals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "post_appeals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewed'::"text", 'resolved'::"text"])))
);


ALTER TABLE "public"."post_appeals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "content" "text" NOT NULL,
    "like_count" integer DEFAULT 0,
    "reply_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone,
    "is_edited" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "is_anonymous" boolean DEFAULT false,
    CONSTRAINT "content_not_empty" CHECK (("length"(TRIM(BOTH FROM "content")) > 0))
);


ALTER TABLE "public"."post_comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_comments" IS 'Stores comments and nested replies on posts';



COMMENT ON COLUMN "public"."post_comments"."parent_id" IS 'NULL for top-level comments, UUID for replies';



COMMENT ON COLUMN "public"."post_comments"."is_anonymous" IS 'If true, the author is hidden from other users';



CREATE TABLE IF NOT EXISTS "public"."post_hashtags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid",
    "hashtag_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."post_hashtags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."post_likes" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_likes" IS 'Stores likes on posts';



CREATE TABLE IF NOT EXISTS "public"."post_queue_status" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid",
    "status" "public"."queue_status" NOT NULL,
    "content" "text" NOT NULL,
    "privacy_level" "public"."privacy_post" NOT NULL,
    "media_count" integer DEFAULT 0,
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "operation_type" "public"."sql_operation",
    "group_id" "uuid"
);


ALTER TABLE "public"."post_queue_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "caption" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."post_shares" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_shares" IS 'Stores post shares with optional caption';



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "media_urls" "text"[],
    "privacy_level" "public"."privacy_post" DEFAULT 'public'::"public"."privacy_post" NOT NULL,
    "updated_at" timestamp with time zone,
    "like_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "moderation_status" "public"."moderation_status",
    "is_flagged" boolean DEFAULT false,
    "flag_reason" "text",
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "moderation_reason" "text",
    "group_id" "uuid",
    "is_anonymous" boolean DEFAULT false
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."posts"."is_anonymous" IS 'If true, the author is hidden from other users';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_name" "text" DEFAULT ''::"text",
    "avatar_url" "text",
    "email" "text",
    "username" "text",
    "global_role" "public"."global_roles",
    "description" "text",
    "create_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "settings" "jsonb",
    "friend_count" integer DEFAULT 0,
    "background_url" "text",
    "slug" "text",
    "phone_number" "text" DEFAULT ''::"text",
    "birth_date" "date"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."background_url" IS 'ảnh bìa';



CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid",
    "reported_type" "text" NOT NULL,
    "reported_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "description" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "public"."report_status",
    CONSTRAINT "reports_reported_type_check" CHECK (("reported_type" = ANY (ARRAY['post'::"text", 'comment'::"text", 'user'::"text", 'message'::"text"])))
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'info'::"text" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_announcements" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ai_analysis_logs"
    ADD CONSTRAINT "ai_analysis_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blocked_keywords"
    ADD CONSTRAINT "blocked_keywords_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_members"
    ADD CONSTRAINT "conversation_members_conversation_id_user_id_key" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversation_members"
    ADD CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id", "user_id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."hashtags"
    ADD CONSTRAINT "hashtags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."hashtags"
    ADD CONSTRAINT "hashtags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderation_actions"
    ADD CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_appeals"
    ADD CONSTRAINT "post_appeals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_hashtags"
    ADD CONSTRAINT "post_hashtags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "post_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_queue_status"
    ADD CONSTRAINT "post_queue_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_shares"
    ADD CONSTRAINT "post_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_display_name_key" UNIQUE ("display_name");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_announcements"
    ADD CONSTRAINT "system_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "unique_comment_like" UNIQUE ("comment_id", "user_id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "unique_post_like" UNIQUE ("post_id", "user_id");



ALTER TABLE ONLY "public"."post_shares"
    ADD CONSTRAINT "unique_recent_share" UNIQUE ("post_id", "user_id", "created_at");



CREATE INDEX "idx_ai_analysis_logs_created_at" ON "public"."ai_analysis_logs" USING "btree" ("created_at");



CREATE INDEX "idx_ai_analysis_logs_target" ON "public"."ai_analysis_logs" USING "btree" ("target_type", "target_id");



CREATE INDEX "idx_blocked_keywords_group_id" ON "public"."blocked_keywords" USING "btree" ("group_id");



CREATE INDEX "idx_blocked_keywords_keyword" ON "public"."blocked_keywords" USING "btree" ("keyword");



CREATE INDEX "idx_comment_likes_comment" ON "public"."comment_likes" USING "btree" ("comment_id");



CREATE INDEX "idx_comment_likes_created" ON "public"."comment_likes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_comment_likes_user" ON "public"."comment_likes" USING "btree" ("user_id");



CREATE INDEX "idx_comments_created" ON "public"."post_comments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_comments_parent" ON "public"."post_comments" USING "btree" ("parent_id");



CREATE INDEX "idx_comments_post" ON "public"."post_comments" USING "btree" ("post_id");



CREATE INDEX "idx_comments_post_parent" ON "public"."post_comments" USING "btree" ("post_id", "parent_id") WHERE ("parent_id" IS NULL);



CREATE INDEX "idx_comments_user" ON "public"."post_comments" USING "btree" ("user_id");



CREATE INDEX "idx_conversation_members_conversation_id" ON "public"."conversation_members" USING "btree" ("conversation_id");



CREATE INDEX "idx_conversation_members_user_id" ON "public"."conversation_members" USING "btree" ("user_id");



CREATE INDEX "idx_conversations_last_message_at" ON "public"."conversations" USING "btree" ("last_message_at" DESC);



CREATE INDEX "idx_friendships_addressee" ON "public"."friendships" USING "btree" ("addressee_id");



CREATE INDEX "idx_friendships_friends" ON "public"."friendships" USING "btree" ("requester_id", "addressee_id") WHERE ("status" = 'friends'::"public"."relationship_status");



CREATE INDEX "idx_friendships_requester" ON "public"."friendships" USING "btree" ("requester_id");



CREATE INDEX "idx_friendships_status" ON "public"."friendships" USING "btree" ("status");



CREATE INDEX "idx_group_members_group_id" ON "public"."group_members" USING "btree" ("group_id");



CREATE INDEX "idx_group_members_user_status_group" ON "public"."group_members" USING "btree" ("user_id", "status") INCLUDE ("group_id");



CREATE INDEX "idx_groups_privacy" ON "public"."groups" USING "btree" ("id") WHERE ("privacy_level" = 'public'::"text");



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_conversation_lookup" ON "public"."messages" USING "btree" ("conversation_id", "created_at" DESC) WHERE ("is_deleted" = false);



COMMENT ON INDEX "public"."idx_messages_conversation_lookup" IS 'Optimized index for fetching conversation messages. Partial index on non-deleted messages for better performance.';



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_reply_to_id" ON "public"."messages" USING "btree" ("reply_to_id");



CREATE INDEX "idx_moderation_actions_created_at" ON "public"."moderation_actions" USING "btree" ("created_at");



CREATE INDEX "idx_moderation_actions_target" ON "public"."moderation_actions" USING "btree" ("target_type", "target_id");



CREATE INDEX "idx_notifications_created" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_entity" ON "public"."notifications" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_notifications_recipient" ON "public"."notifications" USING "btree" ("recipient_id");



CREATE INDEX "idx_notifications_recipient_created" ON "public"."notifications" USING "btree" ("recipient_id", "created_at" DESC);



CREATE INDEX "idx_notifications_sender" ON "public"."notifications" USING "btree" ("sender_id");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_unread" ON "public"."notifications" USING "btree" ("recipient_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_post_likes_created" ON "public"."post_likes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_post_likes_post" ON "public"."post_likes" USING "btree" ("post_id");



CREATE INDEX "idx_post_likes_user" ON "public"."post_likes" USING "btree" ("user_id");



CREATE INDEX "idx_post_queue_status" ON "public"."post_queue_status" USING "btree" ("status");



CREATE INDEX "idx_post_queue_user" ON "public"."post_queue_status" USING "btree" ("user_id");



CREATE INDEX "idx_post_shares_created" ON "public"."post_shares" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_post_shares_post" ON "public"."post_shares" USING "btree" ("post_id");



CREATE INDEX "idx_post_shares_user" ON "public"."post_shares" USING "btree" ("user_id");



CREATE INDEX "idx_posts_group_id" ON "public"."posts" USING "btree" ("group_id");



CREATE INDEX "idx_posts_is_deleted" ON "public"."posts" USING "btree" ("is_deleted");



CREATE INDEX "idx_posts_is_flagged" ON "public"."posts" USING "btree" ("is_flagged");



CREATE INDEX "idx_reports_reported_type" ON "public"."reports" USING "btree" ("reported_type");



CREATE UNIQUE INDEX "idx_unique_friendship" ON "public"."friendships" USING "btree" (LEAST("requester_id", "addressee_id"), GREATEST("requester_id", "addressee_id"));



CREATE INDEX "post_comments_content_gin_idx" ON "public"."post_comments" USING "gin" ("content" "public"."gin_trgm_ops");



CREATE UNIQUE INDEX "profiles_slug_idx" ON "public"."profiles" USING "btree" ("slug");



CREATE OR REPLACE TRIGGER "friendship_count_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."friendships" FOR EACH ROW EXECUTE FUNCTION "public"."update_friend_count"();



CREATE OR REPLACE TRIGGER "friendship_notification_trigger" AFTER INSERT OR UPDATE ON "public"."friendships" FOR EACH ROW EXECUTE FUNCTION "public"."notify_friend_request"();



CREATE OR REPLACE TRIGGER "on_comment_like_created" AFTER INSERT ON "public"."comment_likes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_comment_like"();



CREATE OR REPLACE TRIGGER "on_post_like_created" AFTER INSERT ON "public"."post_likes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_post_like"();



CREATE OR REPLACE TRIGGER "on_post_like_deleted" AFTER DELETE ON "public"."post_likes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_post_unlike"();



CREATE OR REPLACE TRIGGER "on_post_share_created" AFTER INSERT ON "public"."post_shares" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_post_share"();



CREATE OR REPLACE TRIGGER "trg_sync_role_to_jwt" AFTER INSERT OR UPDATE OF "global_role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_role_to_jwt"();



CREATE OR REPLACE TRIGGER "trigger_notify_group_join" AFTER INSERT OR UPDATE OF "status" ON "public"."group_members" FOR EACH ROW EXECUTE FUNCTION "public"."notify_group_join"();



CREATE OR REPLACE TRIGGER "trigger_notify_new_comment" AFTER INSERT ON "public"."post_comments" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_comment"();



CREATE OR REPLACE TRIGGER "trigger_notify_post_status" AFTER UPDATE OF "moderation_status" ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."notify_post_status_change"();



CREATE OR REPLACE TRIGGER "trigger_notify_role_change" AFTER UPDATE OF "global_role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."notify_role_change"();



CREATE OR REPLACE TRIGGER "trigger_update_comment_counts" AFTER INSERT OR DELETE ON "public"."post_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_counts"();



CREATE OR REPLACE TRIGGER "trigger_update_comment_like_count" AFTER INSERT OR DELETE ON "public"."comment_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_like_count"();



CREATE OR REPLACE TRIGGER "trigger_update_comment_timestamp" BEFORE UPDATE ON "public"."post_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_post_share_count" AFTER INSERT OR DELETE ON "public"."post_shares" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_share_count"();



ALTER TABLE ONLY "public"."blocked_keywords"
    ADD CONSTRAINT "blocked_keywords_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blocked_keywords"
    ADD CONSTRAINT "blocked_keywords_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."post_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_members"
    ADD CONSTRAINT "conversation_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_members"
    ADD CONSTRAINT "conversation_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "public"."messages"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."moderation_actions"
    ADD CONSTRAINT "moderation_actions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey1" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_sender_id_fkey1" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_appeals"
    ADD CONSTRAINT "post_appeals_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_appeals"
    ADD CONSTRAINT "post_appeals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."post_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_hashtags"
    ADD CONSTRAINT "post_hashtags_hashtag_id_fkey" FOREIGN KEY ("hashtag_id") REFERENCES "public"."hashtags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_hashtags"
    ADD CONSTRAINT "post_hashtags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_queue_status"
    ADD CONSTRAINT "post_queue_status_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_queue_status"
    ADD CONSTRAINT "post_queue_status_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_queue_status"
    ADD CONSTRAINT "post_queue_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_shares"
    ADD CONSTRAINT "post_shares_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_shares"
    ADD CONSTRAINT "post_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."system_announcements"
    ADD CONSTRAINT "system_announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



CREATE POLICY "Admins can manage system announcements" ON "public"."system_announcements" TO "authenticated" USING ("public"."func_is_admin"()) WITH CHECK ("public"."func_is_admin"());



CREATE POLICY "Admins can update all appeals" ON "public"."post_appeals" FOR UPDATE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can update reports" ON "public"."reports" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."global_role" = 'admin'::"public"."global_roles")))));



CREATE POLICY "Admins can view all reports" ON "public"."reports" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."global_role" = 'admin'::"public"."global_roles")))));



CREATE POLICY "Anyone can view active system announcements" ON "public"."system_announcements" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view comment likes" ON "public"."comment_likes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view likes" ON "public"."post_likes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view shares" ON "public"."post_shares" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can insert analysis logs" ON "public"."ai_analysis_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can view analysis logs" ON "public"."ai_analysis_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Author can update" ON "public"."reports" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "reporter_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "reporter_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."reports" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for users based on user_id" ON "public"."post_queue_status" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable read access for all users" ON "public"."hashtags" TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."post_hashtags" TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."moderation_actions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for users based on user_id" ON "public"."post_queue_status" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."reports" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "reporter_id"));



CREATE POLICY "Global admin can manage global keywords" ON "public"."blocked_keywords" TO "authenticated" USING ((("scope" = 'global'::"text") AND "public"."check_global_min_role"('admin'::"public"."global_roles"))) WITH CHECK ((("scope" = 'global'::"text") AND "public"."check_global_min_role"('admin'::"public"."global_roles")));



CREATE POLICY "Global staff can view global keywords" ON "public"."blocked_keywords" FOR SELECT TO "authenticated" USING ((("scope" = 'global'::"text") AND "public"."check_global_min_role"('moderator'::"public"."global_roles")));



CREATE POLICY "Group staff can manage group keywords" ON "public"."blocked_keywords" TO "authenticated" USING ((("scope" = 'group'::"text") AND "public"."check_group_min_role"("group_id", 'moderator'::"public"."group_roles"))) WITH CHECK ((("scope" = 'group'::"text") AND "public"."check_group_min_role"("group_id", 'moderator'::"public"."group_roles")));



CREATE POLICY "Group staff can view group keywords" ON "public"."blocked_keywords" FOR SELECT TO "authenticated" USING ((("scope" = 'group'::"text") AND "public"."check_group_min_role"("group_id", 'moderator'::"public"."group_roles")));



CREATE POLICY "System can create notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "User can delete profile" ON "public"."profiles" FOR DELETE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "User can insert profiles" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can create appeals" ON "public"."post_appeals" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their shares" ON "public"."post_shares" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can like comments" ON "public"."comment_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can like posts" ON "public"."post_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can share posts" ON "public"."post_shares" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can unlike comments" ON "public"."comment_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can unlike posts" ON "public"."post_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can view own queue status" ON "public"."post_queue_status" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own appeals" ON "public"."post_appeals" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "recipient_id"));



ALTER TABLE "public"."ai_analysis_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blocked_keywords" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_likes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comments_delete_policy" ON "public"."post_comments" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR "public"."func_can_edit_post"("post_id")));



CREATE POLICY "comments_insert_policy" ON "public"."post_comments" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND "public"."func_can_view_post"("post_id")));



CREATE POLICY "comments_select_policy" ON "public"."post_comments" FOR SELECT TO "authenticated" USING ("public"."func_can_view_post"("post_id"));



CREATE POLICY "comments_update_policy" ON "public"."post_comments" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR "public"."func_can_edit_post"("post_id")));



ALTER TABLE "public"."conversation_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversation_members_delete_policy" ON "public"."conversation_members" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."func_can_manage_conversation"("conversation_id")));



CREATE POLICY "conversation_members_insert_policy" ON "public"."conversation_members" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."func_can_manage_conversation"("conversation_id")));



CREATE POLICY "conversation_members_select_policy" ON "public"."conversation_members" FOR SELECT TO "authenticated" USING (("public"."func_is_conversation_member"("conversation_id", "auth"."uid"()) OR "public"."func_is_admin"()));



CREATE POLICY "conversation_members_update_policy" ON "public"."conversation_members" FOR UPDATE TO "authenticated" USING ("public"."func_can_manage_conversation"("conversation_id"));



ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_insert_policy" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "conversations_select_policy" ON "public"."conversations" FOR SELECT TO "authenticated" USING (("public"."func_is_conversation_member"("id", "auth"."uid"()) OR ("created_by" = "auth"."uid"()) OR "public"."func_is_admin"()));



CREATE POLICY "conversations_update_policy" ON "public"."conversations" FOR UPDATE TO "authenticated" USING ("public"."func_can_manage_conversation"("id"));



ALTER TABLE "public"."friendships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "friendships_delete_policy" ON "public"."friendships" FOR DELETE TO "authenticated" USING ((("requester_id" = "auth"."uid"()) OR ("addressee_id" = "auth"."uid"())));



CREATE POLICY "friendships_insert_policy" ON "public"."friendships" FOR INSERT TO "authenticated" WITH CHECK (("requester_id" = "auth"."uid"()));



CREATE POLICY "friendships_select_policy" ON "public"."friendships" FOR SELECT TO "authenticated" USING ((("requester_id" = "auth"."uid"()) OR ("addressee_id" = "auth"."uid"())));



CREATE POLICY "friendships_update_policy" ON "public"."friendships" FOR UPDATE TO "authenticated" USING ((("requester_id" = "auth"."uid"()) OR ("addressee_id" = "auth"."uid"())));



CREATE POLICY "group_delete_policy" ON "public"."groups" FOR DELETE TO "authenticated" USING ("public"."func_can_manage_group"("id"));



ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "group_members_delete_policy" ON "public"."group_members" FOR DELETE TO "authenticated" USING (("public"."is_group_manager"("group_id") OR ("auth"."uid"() = "user_id")));



CREATE POLICY "group_members_insert_policy" ON "public"."group_members" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") OR "public"."is_group_manager"("group_id")));



CREATE POLICY "group_members_select_policy" ON "public"."group_members" FOR SELECT TO "authenticated" USING (("public"."can_view_group_content"("group_id") OR ("role" = ANY (ARRAY['admin'::"public"."group_roles", 'sub_admin'::"public"."group_roles", 'moderator'::"public"."group_roles"])) OR "public"."is_friend"("user_id")));



CREATE POLICY "group_members_update_policy" ON "public"."group_members" FOR UPDATE TO "authenticated" USING (("public"."is_group_manager"("group_id") OR ("auth"."uid"() = "user_id")));



ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "groups_delete_policy" ON "public"."groups" FOR DELETE TO "authenticated" USING (("public"."is_group_manager"("id") OR "public"."is_admin"()));



CREATE POLICY "groups_insert_policy" ON "public"."groups" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "groups_select_policy" ON "public"."groups" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "groups_update_policy" ON "public"."groups" FOR UPDATE TO "authenticated" USING (("public"."is_group_manager"("id") OR "public"."is_admin"()));



ALTER TABLE "public"."hashtags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_delete_policy" ON "public"."messages" FOR DELETE TO "authenticated" USING ((("sender_id" = "auth"."uid"()) OR "public"."func_can_moderate_conversation"("conversation_id")));



CREATE POLICY "messages_insert_policy" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK (("public"."func_is_conversation_member"("conversation_id", "auth"."uid"()) AND ("sender_id" = "auth"."uid"())));



CREATE POLICY "messages_select_policy" ON "public"."messages" FOR SELECT TO "authenticated" USING (("public"."func_is_conversation_member"("conversation_id", "auth"."uid"()) OR "public"."func_is_admin"()));



CREATE POLICY "messages_update_policy" ON "public"."messages" FOR UPDATE TO "authenticated" USING (("sender_id" = "auth"."uid"()));



ALTER TABLE "public"."moderation_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_appeals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_hashtags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_queue_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "posts_delete_policy" ON "public"."posts" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "author_id") OR "public"."is_group_manager"("group_id")));



CREATE POLICY "posts_insert_policy" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_group_member"("group_id"));



CREATE POLICY "posts_select_policy" ON "public"."posts" FOR SELECT TO "authenticated" USING ("public"."func_can_view_post"("id"));



CREATE POLICY "posts_update_policy" ON "public"."posts" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "author_id") OR "public"."is_group_manager"("group_id")));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_policy" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_update_policy" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"()));



ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_announcements" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_members";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."hashtags";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."post_queue_status";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."posts";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";
































































































































































































































































































GRANT ALL ON FUNCTION "public"."are_friends"("p_user_id_1" "uuid", "p_user_id_2" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."are_friends"("p_user_id_1" "uuid", "p_user_id_2" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."are_friends"("p_user_id_1" "uuid", "p_user_id_2" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_group_content"("check_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_group_content"("check_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_group_content"("check_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_post"("post_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_post"("post_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_post"("post_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_global_min_role"("min_role" "public"."global_roles") TO "anon";
GRANT ALL ON FUNCTION "public"."check_global_min_role"("min_role" "public"."global_roles") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_global_min_role"("min_role" "public"."global_roles") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_group_min_role"("group_id" "uuid", "min_role" "public"."group_roles") TO "anon";
GRANT ALL ON FUNCTION "public"."check_group_min_role"("group_id" "uuid", "min_role" "public"."group_roles") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_group_min_role"("group_id" "uuid", "min_role" "public"."group_roles") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_sender_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_sender_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_sender_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_hashtag_count"("hashtag_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_hashtag_count"("hashtag_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_hashtag_count"("hashtag_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."func_can_edit_post"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."func_can_edit_post"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."func_can_edit_post"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."func_can_manage_conversation"("c_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."func_can_manage_conversation"("c_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."func_can_manage_conversation"("c_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."func_can_manage_group"("g_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."func_can_manage_group"("g_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."func_can_manage_group"("g_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."func_can_moderate_conversation"("c_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."func_can_moderate_conversation"("c_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."func_can_moderate_conversation"("c_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."func_can_view_group"("g_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."func_can_view_group"("g_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."func_can_view_group"("g_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."func_can_view_post"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."func_can_view_post"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."func_can_view_post"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."func_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."func_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."func_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."func_is_conversation_member"("c_id" "uuid", "u_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."func_is_conversation_member"("c_id" "uuid", "u_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."func_is_conversation_member"("c_id" "uuid", "u_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."func_is_friend"("target_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."func_is_friend"("target_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."func_is_friend"("target_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."func_is_group_admin"("g_id" "uuid", "u_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."func_is_group_admin"("g_id" "uuid", "u_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."func_is_group_admin"("g_id" "uuid", "u_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."func_is_group_member"("g_id" "uuid", "u_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."func_is_group_member"("g_id" "uuid", "u_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."func_is_group_member"("g_id" "uuid", "u_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."func_is_lecture"() TO "anon";
GRANT ALL ON FUNCTION "public"."func_is_lecture"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."func_is_lecture"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_comment_count"("p_post_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_comment_count"("p_post_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_comment_count"("p_post_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversations_with_details"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversations_with_details"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversations_with_details"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_posts"("p_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_posts"("p_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_posts"("p_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_follower_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_follower_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_follower_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_following_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_following_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_following_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_friend_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_friend_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_friend_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_post_like_count"("p_post_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_post_like_count"("p_post_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_post_like_count"("p_post_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_reply_count"("p_comment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_reply_count"("p_comment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reply_count"("p_comment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_share_count"("p_post_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_share_count"("p_post_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_share_count"("p_post_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_task_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_task_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_task_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_friends"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_friends"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_friends"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_comment_like"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_comment_like"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_comment_like"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_post_comment"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_post_comment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_post_comment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_post_like"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_post_like"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_post_like"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_post_share"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_post_share"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_post_share"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_post_comment_deleted"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_post_comment_deleted"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_post_comment_deleted"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_post_unlike"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_post_unlike"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_post_unlike"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_user_liked_post"("p_post_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_user_liked_post"("p_post_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_user_liked_post"("p_post_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_hashtag_count"("hashtag_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_hashtag_count"("hashtag_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_hashtag_count"("hashtag_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_following"("p_follower_id" "uuid", "p_following_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_following"("p_follower_id" "uuid", "p_following_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_following"("p_follower_id" "uuid", "p_following_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_friend"("target_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_friend"("target_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_friend"("target_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_group_admin"("_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_admin"("_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_admin"("_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_group_manager"("check_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_manager"("check_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_manager"("check_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_group_member"("check_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_member"("check_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_member"("check_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_conversation_as_read"("conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_conversation_as_read"("conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_conversation_as_read"("conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_friend_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_friend_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_friend_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_group_join"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_group_join"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_group_join"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_comment"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_comment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_comment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_on_follow"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_follow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_follow"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_post_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_post_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_post_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_role_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_role_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_role_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_engagement_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_engagement_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_engagement_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_friends_view"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_friends_view"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_friends_view"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_users_with_friendship"("search_query" "text", "role_filter" "text", "friend_status_filter" "text", "limit_val" integer, "offset_val" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_users_with_friendship"("search_query" "text", "role_filter" "text", "friend_status_filter" "text", "limit_val" integer, "offset_val" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_users_with_friendship"("search_query" "text", "role_filter" "text", "friend_status_filter" "text", "limit_val" integer, "offset_val" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."share_post"("p_post_id" "uuid", "p_user_id" "uuid", "p_caption" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."share_post"("p_post_id" "uuid", "p_user_id" "uuid", "p_caption" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."share_post"("p_post_id" "uuid", "p_user_id" "uuid", "p_caption" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_role_to_jwt"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_role_to_jwt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_role_to_jwt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_comment_like"("p_comment_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_comment_like"("p_comment_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_comment_like"("p_comment_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_post_like"("p_post_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_post_like"("p_post_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_post_like"("p_post_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_ip_address" "inet", "p_user_agent" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_refresh_friends"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_refresh_friends"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_refresh_friends"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_like_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_like_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_like_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_friend_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_friend_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_friend_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_like_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_like_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_like_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_share_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_share_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_share_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";





















GRANT ALL ON TABLE "public"."ai_analysis_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_analysis_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_analysis_logs" TO "service_role";



GRANT ALL ON TABLE "public"."blocked_keywords" TO "anon";
GRANT ALL ON TABLE "public"."blocked_keywords" TO "authenticated";
GRANT ALL ON TABLE "public"."blocked_keywords" TO "service_role";



GRANT ALL ON TABLE "public"."comment_likes" TO "anon";
GRANT ALL ON TABLE "public"."comment_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_likes" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_members" TO "anon";
GRANT ALL ON TABLE "public"."conversation_members" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_members" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."friendships" TO "anon";
GRANT ALL ON TABLE "public"."friendships" TO "authenticated";
GRANT ALL ON TABLE "public"."friendships" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."hashtags" TO "anon";
GRANT ALL ON TABLE "public"."hashtags" TO "authenticated";
GRANT ALL ON TABLE "public"."hashtags" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."moderation_actions" TO "anon";
GRANT ALL ON TABLE "public"."moderation_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_actions" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."post_appeals" TO "anon";
GRANT ALL ON TABLE "public"."post_appeals" TO "authenticated";
GRANT ALL ON TABLE "public"."post_appeals" TO "service_role";



GRANT ALL ON TABLE "public"."post_comments" TO "anon";
GRANT ALL ON TABLE "public"."post_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."post_comments" TO "service_role";



GRANT ALL ON TABLE "public"."post_hashtags" TO "anon";
GRANT ALL ON TABLE "public"."post_hashtags" TO "authenticated";
GRANT ALL ON TABLE "public"."post_hashtags" TO "service_role";



GRANT ALL ON TABLE "public"."post_likes" TO "anon";
GRANT ALL ON TABLE "public"."post_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."post_likes" TO "service_role";



GRANT ALL ON TABLE "public"."post_queue_status" TO "anon";
GRANT ALL ON TABLE "public"."post_queue_status" TO "authenticated";
GRANT ALL ON TABLE "public"."post_queue_status" TO "service_role";



GRANT ALL ON TABLE "public"."post_shares" TO "anon";
GRANT ALL ON TABLE "public"."post_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."post_shares" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."system_announcements" TO "anon";
GRANT ALL ON TABLE "public"."system_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."system_announcements" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































