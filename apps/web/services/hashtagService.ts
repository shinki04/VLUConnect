/**
 * Hashtag Service - Server-side functions for hashtag operations
 */
import { createClient } from "@repo/supabase/server";

import { PostResponse } from "@repo/shared/types/post";

interface HashtagWithCount {
  id: string;
  name: string;
  post_count: number;
  created_at: string;
}

interface PostsByHashtagResult {
  posts: PostResponse[];
  total: number;
}

/**
 * Get trending hashtags sorted by post count
 */
export async function getTrendingHashtags(limit: number = 10): Promise<HashtagWithCount[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("hashtags")
    .select("*")
    .order("post_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching trending hashtags:", error);
    throw new Error(`Failed to fetch trending hashtags: ${error.message}`);
  }

  return (data || []) as HashtagWithCount[];
}

/**
 * Search hashtags by name
 */
export async function searchHashtags(query: string, limit: number = 20): Promise<HashtagWithCount[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("hashtags")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("post_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error searching hashtags:", error);
    throw new Error(`Failed to search hashtags: ${error.message}`);
  }

  return (data || []) as HashtagWithCount[];
}

/**
 * Get posts for a specific hashtag with pagination
 */
export async function getPostsByHashtag(
  hashtagName: string,
  limit: number = 10,
  offset: number = 0
): Promise<PostsByHashtagResult> {
  const supabase = await createClient();
  
  // First get the hashtag ID
  const { data: hashtag, error: hashtagError } = await supabase
    .from("hashtags")
    .select("id")
    .eq("name", hashtagName)
    .single();

  if (hashtagError || !hashtag) {
    return { posts: [], total: 0 };
  }

  // Get total count
  const { count, error: countError } = await supabase
    .from("post_hashtags")
    .select("*", { count: "exact", head: true })
    .eq("hashtag_id", hashtag.id);

  if (countError) {
    console.error("Error counting posts:", countError);
    throw new Error(`Failed to count posts: ${countError.message}`);
  }

  // Get posts with author info
  const { data: postHashtags, error: postsError } = await supabase
    .from("post_hashtags")
    .select(`
      post_id,
      posts (
        id,
        created_at,
        author:author_id (
          id,
          username,
          display_name,
          avatar_url,
          global_role
        ),
        content,
        media_urls,
        updated_at,
        like_count,
        comment_count,
        share_count,
        privacy_level
      )
    `)
    .eq("hashtag_id", hashtag.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (postsError) {
    console.error("Error fetching posts:", postsError);
    throw new Error(`Failed to fetch posts: ${postsError.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = (postHashtags || []).map((ph: any) => ph.posts).filter(Boolean);

  return {
    posts,
    total: count || 0,
  };
}
