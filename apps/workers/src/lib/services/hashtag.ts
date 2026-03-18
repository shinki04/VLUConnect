import { getRedisClient } from "@repo/redis/redis";
import { createServiceClient } from "@repo/supabase/service";
import { extractHashtags } from "@repo/utils/hashtagUtils";


interface HashtagWithCount {
  id: string;
  name: string;
  post_count: number;
  created_at: string;
}

/**
 * Extract hashtags from content and save to database
 */
export async function saveHashtagsFromContent(
  content: string,
  postId: string
): Promise<HashtagWithCount[]> {
  const supabase = createServiceClient();
  const hashtags = extractHashtags(content);

  if (hashtags.length === 0) {
    return [];
  }

  const savedHashtags: HashtagWithCount[] = [];

  for (const tagName of hashtags) {
    try {
      // Check if hashtag exists
      const { data: existingTag } = await supabase
        .from("hashtags")
        .select("*")
        .eq("name", tagName)
        .single();

      let hashtagId: string;

      if (existingTag) {
        hashtagId = existingTag.id;
      } else {
        // Create new hashtag
        const { data: newTag, error: createError } = await supabase
          .from("hashtags")
          .insert({ name: tagName, post_count: 0 })
          .select()
          .single();

        if (createError) {
          console.error(`Failed to create hashtag '${tagName}':`, createError);
          continue;
        }

        hashtagId = newTag!.id;
      }

      // Create post_hashtag relationship
      const { error: linkError } = await supabase
        .from("post_hashtags")
        .insert({ post_id: postId, hashtag_id: hashtagId });

      if (linkError) {
        console.error(
          `Failed to link hashtag '${tagName}' to post:`,
          linkError
        );
        continue;
      }

      // Increment post_count using database function
      const { error: incrementError } = await supabase.rpc(
        "increment_hashtag_count",
        { hashtag_id: hashtagId }
      );

      if (incrementError) {
        console.error(
          `Failed to increment hashtag count for '${tagName}':`,
          incrementError
        );
        continue;
      }

      // Fetch updated hashtag
      const { data: updatedTag } = await supabase
        .from("hashtags")
        .select("*")
        .eq("id", hashtagId)
        .single();

      if (updatedTag) {
        savedHashtags.push(updatedTag as HashtagWithCount);
      }

      console.log(`Hashtag '${tagName}' saved and linked to post`);
    } catch (error) {
      console.error(`Error processing hashtag '${tagName}':`, error);
    }
  }

  // Invalidate cache
  const redis = getRedisClient();
  if (redis.isReady()) {
    await redis.delCache("trending:hashtags");
    console.log("Cleared hashtag cache");
  }

  return savedHashtags;
}

/**
 * Sync hashtags when post is updated
 * Removes old hashtags and adds new ones
 */
export async function syncHashtagsForPost(
  content: string,
  postId: string
): Promise<HashtagWithCount[]> {
  const supabase = createServiceClient();
  
  // Extract new hashtags from updated content
  const newHashtagNames = extractHashtags(content);
  
  // Get existing hashtags for this post
  const { data: existingPostHashtags } = await supabase
    .from("post_hashtags")
    .select("hashtag_id, hashtags(id, name)")
    .eq("post_id", postId);
  
  const existingHashtagNames = 
    existingPostHashtags?.map((ph: any) => ph.hashtags?.name).filter(Boolean) || [];
  
  const existingHashtagIds = 
    existingPostHashtags?.reduce((acc: Record<string, string>, ph: any) => {
      if (ph.hashtags?.name) {
        acc[ph.hashtags.name] = ph.hashtag_id;
      }
      return acc;
    }, {}) || {};
  
  // Determine which hashtags to add and remove
  const hashtagsToAdd = newHashtagNames.filter(
    (tag) => !existingHashtagNames.includes(tag)
  );
  const hashtagsToRemove = existingHashtagNames.filter(
    (tag) => !newHashtagNames.includes(tag)
  );
  
  console.log(`Hashtag sync for post ${postId}:
    - Adding: ${hashtagsToAdd.join(", ") || "none"}
    - Removing: ${hashtagsToRemove.join(", ") || "none"}
    - Keeping: ${newHashtagNames.filter(tag => existingHashtagNames.includes(tag)).join(", ") || "none"}`);
  
  // Remove old hashtags
  for (const tagName of hashtagsToRemove) {
    try {
      const hashtagId = existingHashtagIds[tagName];
      if (!hashtagId) continue;
      
      // Delete post_hashtag relationship
      const { error: deleteError } = await supabase
        .from("post_hashtags")
        .delete()
        .eq("post_id", postId)
        .eq("hashtag_id", hashtagId);
      
      if (deleteError) {
        console.error(
          `Failed to remove hashtag '${tagName}' from post:`,
          deleteError
        );
        continue;
      }
      
      // Decrement post_count using database function
      const { error: decrementError } = await supabase.rpc(
        "decrement_hashtag_count" as any,
        { hashtag_id: hashtagId }
      );
      
      if (decrementError) {
        console.error(
          `Failed to decrement hashtag count for '${tagName}':`,
          decrementError
        );
      } else {
        console.log(`Removed hashtag '${tagName}' from post`);
      }
    } catch (error) {
      console.error(`Error removing hashtag '${tagName}':`, error);
    }
  }
  
  // Add new hashtags
  const savedHashtags: HashtagWithCount[] = [];
  for (const tagName of hashtagsToAdd) {
    try {
      // Check if hashtag exists
      const { data: existingTag } = await supabase
        .from("hashtags")
        .select("*")
        .eq("name", tagName)
        .single();
      
      let hashtagId: string;
      
      if (existingTag) {
        hashtagId = existingTag.id;
      } else {
        // Create new hashtag
        const { data: newTag, error: createError } = await supabase
          .from("hashtags")
          .insert({ name: tagName, post_count: 0 })
          .select()
          .single();
        
        if (createError) {
          console.error(`Failed to create hashtag '${tagName}':`, createError);
          continue;
        }
        
        hashtagId = newTag!.id;
      }
      
      // Create post_hashtag relationship
      const { error: linkError } = await supabase
        .from("post_hashtags")
        .insert({ post_id: postId, hashtag_id: hashtagId });
      
      if (linkError) {
        console.error(
          `Failed to link hashtag '${tagName}' to post:`,
          linkError
        );
        continue;
      }
      
      // Increment post_count using database function
      const { error: incrementError } = await supabase.rpc(
        "increment_hashtag_count",
        { hashtag_id: hashtagId }
      );
      
      if (incrementError) {
        console.error(
          `Failed to increment hashtag count for '${tagName}':`,
          incrementError
        );
        continue;
      }
      
      // Fetch updated hashtag
      const { data: updatedTag } = await supabase
        .from("hashtags")
        .select("*")
        .eq("id", hashtagId)
        .single();
      
      if (updatedTag) {
        savedHashtags.push(updatedTag as HashtagWithCount);
      }
      
      console.log(`Added hashtag '${tagName}' to post`);
    } catch (error) {
      console.error(`Error adding hashtag '${tagName}':`, error);
    }
  }
  
  // Invalidate cache
  const redis = getRedisClient();
  if (redis.isReady()) {
    await redis.delCache("trending:hashtags");
    console.log("Cleared hashtag cache");
  }
  
  return savedHashtags;
}

/**
 * Remove all hashtags for a post (when post is deleted)
 */
export async function removeHashtagsForPost(postId: string): Promise<void> {
  const supabase = createServiceClient();
  
  try {
    // Get all hashtags associated with this post
    const { data: postHashtags, error: fetchError } = await supabase
      .from("post_hashtags")
      .select("hashtag_id, hashtags(name)")
      .eq("post_id", postId);
    
    if (fetchError) {
      console.error("Failed to fetch hashtags for post:", fetchError);
      return;
    }
    
    if (!postHashtags || postHashtags.length === 0) {
      console.log("No hashtags to remove for this post");
      return;
    }
    
    console.log(`Removing ${postHashtags.length} hashtags for post ${postId}`);
    
    // Decrement count for each hashtag
    for (const ph of postHashtags) {
      try {
        const { error: decrementError } = await supabase.rpc(
          "decrement_hashtag_count" as any,
          { hashtag_id: ph.hashtag_id }
        );
        
        if (decrementError) {
          console.error(
            `Failed to decrement count for hashtag:`,
            decrementError
          );
        }
      } catch (error) {
        console.error("Error decrementing hashtag count:", error);
      }
    }
    
    // Delete all post_hashtag relationships
    const { error: deleteError } = await supabase
      .from("post_hashtags")
      .delete()
      .eq("post_id", postId);
    
    if (deleteError) {
      console.error("Failed to delete post_hashtags:", deleteError);
      return;
    }
    
    console.log(`Removed all hashtags for post ${postId}`);
    
    // Invalidate cache
    const redis = getRedisClient();
    if (redis.isReady()) {
      await redis.delCache("trending:hashtags");
      console.log("Cleared hashtag cache");
    }
  } catch (error) {
    console.error("Error removing hashtags for post:", error);
  }
}


/**
 * Get trending hashtags with caching
 */
export async function getTrendingHashtags(
  limit: number = 10
): Promise<HashtagWithCount[]> {
  const redis = getRedisClient();

  // Try to get from cache
  if (redis.isReady()) {
    const cached = await redis.getCache<HashtagWithCount[]>(
      "trending:hashtags"
    );
    if (cached) {
      console.log("Hashtags from cache");
      return cached.slice(0, limit);
    }
  }

  // Fetch from database
  const supabase = createServiceClient();
  const { data: hashtags, error } = await supabase
    .from("hashtags")
    .select("*")
    .order("post_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch trending hashtags:", error);
    return [];
  }

  // Cache for 5 minutes
  if (redis.isReady()) {
    await redis.setCache("trending:hashtags", hashtags || [], 300);
    console.log(" Cached trending hashtags");
  }

  return (hashtags || []) as HashtagWithCount[];
}

/**
 * Search hashtags by name
 */
export async function searchHashtags(
  query: string,
  limit: number = 20
): Promise<HashtagWithCount[]> {
  const supabase = createServiceClient();

  const { data: hashtags, error } = await supabase
    .from("hashtags")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("post_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to search hashtags:", error);
    return [];
  }

  return (hashtags || []) as HashtagWithCount[];
}

/**
 * Get posts for a specific hashtag
 */
export async function getPostsByHashtag(
  hashtagName: string,
  limit: number = 10,
  offset: number = 0
) {
  const supabase = createServiceClient();

  // Get hashtag ID
  const { data: hashtag, error: hashtagError } = await supabase
    .from("hashtags")
    .select("id")
    .eq("name", hashtagName)
    .single();

  if (hashtagError || !hashtag) {
    console.error("Hashtag not found:", hashtagName);
    return { posts: [], total: 0 };
  }

  // Get posts linked to this hashtag
  const {
    data: posts,
    error: postsError,
    count,
  } = await supabase
    .from("post_hashtags")
    .select("posts(*)", { count: "exact" })
    .eq("hashtag_id", hashtag.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (postsError) {
    console.error("Failed to fetch posts for hashtag:", postsError);
    return { posts: [], total: 0 };
  }

  return {
    posts: posts?.map((ph) => ph.posts).filter(Boolean) || [],
    total: count || 0,
  };
}

/**
 * Get hashtags for a specific post
 */
export async function getHashtagsForPost(
  postId: string
): Promise<HashtagWithCount[]> {
  const supabase = createServiceClient();

  const { data: postHashtags, error } = await supabase
    .from("post_hashtags")
    .select("hashtags(*)")
    .eq("post_id", postId);

  if (error) {
    console.error("Failed to fetch hashtags for post:", error);
    return [];
  }

  return (postHashtags?.map((ph) => ph.hashtags).filter(Boolean) ||
    []) as HashtagWithCount[];
}

/**
 * Delete hashtag and all associations
 */
export async function deleteHashtag(hashtagId: string): Promise<boolean> {
  const supabase = createServiceClient();

  // This will cascade delete due to ON DELETE CASCADE
  const { error } = await supabase
    .from("hashtags")
    .delete()
    .eq("id", hashtagId);

  if (error) {
    console.error("Failed to delete hashtag:", error);
    return false;
  }

  // Invalidate cache
  const redis = getRedisClient();
  if (redis.isReady()) {
    await redis.delCache("trending:hashtags");
  }

  console.log("Hashtag deleted");
  return true;
}
