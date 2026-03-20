"use server";
import { getPostRabbitMQClient } from "@repo/rabbitmq/PostRabbitMQ";
import { getFeedCacheService } from "@repo/redis/feedCacheService";
import { getPostCacheService } from "@repo/redis/postCacheService";
import { getRedisClient } from "@repo/redis/redis";
import { FeedFilter, Post, PostResponse, privacyPost } from "@repo/shared/types/post";
import { PostQueueDeletePayload } from "@repo/shared/types/postQueue";
import { createClient } from "@repo/supabase/server";

async function removeHashtagsForPost(postId: string) {
  const supabase = await createClient();
  try {
    const { data: postHashtags } = await supabase
      .from("post_hashtags")
      .select("hashtag_id")
      .eq("post_id", postId);

    if (postHashtags && postHashtags.length > 0) {
      for (const ph of postHashtags) {
        if (ph.hashtag_id) {
          await supabase.rpc("decrement_hashtag_count", {
            hashtag_id: ph.hashtag_id,
          });
        }
      }

      await supabase
        .from("post_hashtags")
        .delete()
        .eq("post_id", postId);
        
      const redis = getRedisClient();
      if (redis.isReady()) {
        await redis.delCache("trending:hashtags");
      }
    }
  } catch (error) {
    console.error("Error removing hashtags for post:", error);
  }
}

const feedCache = getFeedCacheService();
const postCache = getPostCacheService();

export interface CreatePostInput {
  content: string;
  privacy_level: "public" | "friends" | "private";
  media: File[];
}

export interface CreatePostResponse {
  post: Post;
  mediaUrls: string[];
}

export interface FetchPostsResponse {
  posts: PostResponse[];
  hasMore: boolean;
  total: number;
  currentPage: number;
}

export async function fetchPosts(
  page: number,
  itemsPerPage: number,
  filter: FeedFilter = "all"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Try cache first
  const cachedFeed = await feedCache.getCachedFeedPage(user.id, page, itemsPerPage);
  if (cachedFeed) {
    return {
      posts: cachedFeed.posts as unknown as PostResponse[],
      hasMore: cachedFeed.hasMore,
      total: cachedFeed.total,
      currentPage: cachedFeed.page,
    };
  }

  // Validate page number
  if (page < 1) {
    throw new Error("Page number must be greater than 0");
  }

  const offset = (page - 1) * itemsPerPage;

  // Fetch posts and count for current page using RPC
  const { data, count, error } = await supabase
    .rpc(
      "get_dashboard_posts" as never,
      { p_filter: filter } as never,
      { count: "exact" }
    )
    .range(offset, offset + itemsPerPage - 1);

  if (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }

  const typedData = (data as unknown as PostResponse[]) || [];
  const total = count || 0;

  let postsWithLikeStatus = typedData;

  if (user && typedData.length > 0) {
    const postIds = typedData.map((p) => p.id);
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);

    const likedPostIds = new Set(likes?.map((l) => l.post_id) || []);

    postsWithLikeStatus = typedData.map((post) => ({
      ...post,
      is_liked_by_viewer: likedPostIds.has(post.id),
    }));
  } else {
    postsWithLikeStatus = typedData.map((post) => ({
      ...post,
      is_liked_by_viewer: false,
    }));
  }

  // Check if there are more posts after current page
  const hasMore = offset + itemsPerPage < total;

  const result = {
    posts: postsWithLikeStatus,
    hasMore,
    total,
    currentPage: page,
  };

  // Cache the feed page

  await feedCache.setCachedFeedPage(user.id, page, itemsPerPage, {
    posts: postsWithLikeStatus,
    page,
    hasMore,
    total,
    itemsPerPage,
  });

  return result;
}

// export async function getPostIdsWithCache(userId: string) {
//   let postIds = await redis.getCache<string[]>(`feed:${userId}`);
//   if (!postIds) {
//     const response = await fetchPosts(1, 100); // lấy nhiều ID để cache
//     postIds = response.posts.map((p) => p.id);
//     await redis.setCache(`post:${userId}`, postIds, 60);
//   }
//   return postIds;
// }
// export async function getPostCached(postId: string) {
//   let post = await redis.getCache<Post>(`post:${postId}`);
//   if (!post || post !== undefined || post !== null) {
//     // fetch từ DB
//     post = await fetchPostById(postId);
//     await redis.setCache(`post:${postId}`, post, 3600);
//   }
//   return post;
// }

export async function fetchPostById(postId: string) {
  try {
    const rawPost = await postCache.getCachedOrFetch(postId, async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          created_at, 
          author: profiles!posts_author_id_fkey(
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
          privacy_level,
          is_anonymous,
          group_id
        `)
        .eq("id", postId)
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch post: ${error.message}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data as any;
    });

    if (!rawPost) {
       throw new Error("Post not found");
    }

    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    let isLikedByViewer = false;
    if (user && rawPost) {
      const { data: like } = await supabaseAuth
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .single();
      isLikedByViewer = !!like;
    }

    return {
      ...rawPost,
      is_liked_by_viewer: isLikedByViewer,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Caught an Error object:", error.message);
    } else {
      console.error("Caught an unknown type of error:", error);
    }
  }
}

export async function fetchPostByAuthor(
  page: number,
  itemsPerPage: number,
  authorId: string
) {
  const supabase = await createClient();

  // Validate page number
  if (page < 1) {
    throw new Error("Page number must be greater than 0");
  }

  const offset = (page - 1) * itemsPerPage;

  // Get total count
  const { count, error: countError } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", authorId);

  if (countError) {
    throw new Error(`Failed to count posts: ${countError.message}`);
  }

  const total = count || 0;

  // If offset is beyond total, return empty array
  if (offset >= total && total > 0) {
    return {
      posts: [],
      hasMore: false,
      total,
      currentPage: page,
    };
  }

  // Fetch posts for current page
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      id,
      created_at, 
          author: profiles!posts_author_id_fkey(
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
      privacy_level,
      is_anonymous
      `
    )
    .eq("author_id", authorId)
    .range(offset, offset + itemsPerPage - 1)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }

  const {
      data: { user },
    } = await supabase.auth.getUser();

  let postsWithLikeStatus = data || [];

  if (user && data && data.length > 0) {
    const postIds = data.map((p) => p.id);
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);

    const likedPostIds = new Set(likes?.map((l) => l.post_id) || []);

    postsWithLikeStatus = data.map((post) => ({
      ...post,
      is_liked_by_viewer: likedPostIds.has(post.id),
    }));
  } else {
      postsWithLikeStatus = (data || []).map((post) => ({
      ...post,
      is_liked_by_viewer: false,
    }));
  }

  // Check if there are more posts after current page
  const hasMore = offset + itemsPerPage < total;

  const result = {
    posts: postsWithLikeStatus,
    hasMore,
    total,
    currentPage: page,
  };
  return result;
}

export async function deletePost(
  postId: string,
  // We keep this to not break the signature, but we ignore it and use DB true author
  _clientAuthorId?: string 
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const postRabbitMQClient = getPostRabbitMQClient();
  if (!postRabbitMQClient.isReady()) {
    await postRabbitMQClient.connect();
  }

  // We MUST fetch the true post author to know if we are the owner or just an admin
  const { data: postRecord, error: fetchError } = await supabase
    .from("posts")
    .select(`
      author_id,
      media_urls,
      group_id,
      groups (
        name
      )
    `)
    .eq("id", postId)
    .single();

  if (fetchError || !postRecord) {
    throw new Error(`Failed to fetch post to delete: ${fetchError?.message}`);
  }

  const isOwner = user.id === postRecord.author_id;

  // Determine if user is author
  if (isOwner) {
    // Clean up hashtags before soft or hard delete
    await removeHashtagsForPost(postId);

    // Hard delete for author
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
    
    await postCache.invalidatePost(postId);
    await feedCache.invalidateAllFeeds();
    
    if (postRecord.media_urls && postRecord.media_urls.length > 0) {
        const payload: PostQueueDeletePayload = {
          media_urls: postRecord.media_urls,
          queueId: postId,
        };
        await postRabbitMQClient.publishPostDelete(payload);
    }
  } else {
    // Clean up hashtags before soft or hard delete
    await removeHashtagsForPost(postId);

    // Soft delete for group admin
    const { error } = await supabase
      .from("posts")
      .update({ is_deleted: true })
      .eq("id", postId);

    if (error) {
      throw new Error(`Failed to soft delete post: ${error.message}`);
    }

    await postCache.invalidatePost(postId);
    await feedCache.invalidateAllFeeds();

    // Attempt to notify the author
    try {
      // Supabase 1-to-1 returns an object, not an array
      const groupData = postRecord.groups as { name: string } | null | undefined | { name: string }[];
      const groupName = Array.isArray(groupData) 
        ? groupData[0]?.name 
        : groupData?.name || "nhóm";

      const notifParams = {
        recipient_id: postRecord.author_id, // The real author of the post
        sender_id: user.id,
        type: "system" as const,
        entity_type: "post_deleted",
        entity_id: postId,
        title: "Bài viết của bạn đã bị xóa",
        message: `Một quản trị viên đã xóa bài viết của bạn trong ${groupName}.`,
        metadata: { group_id: postRecord.group_id }
      };

      const { error: notifError } = await supabase.from("notifications").insert(notifParams);
      if (notifError) {
        console.error("Supabase Notification Insert failed:", notifError);
      } else {
        console.log("Supabase Notification Inserted:", notifParams);
      }
    } catch (notifException) {
      console.error("Failed to send deletion notification:", notifException);
    }
  }
}

export async function updatePost(
  postId: string,
  content: string,
  privacy_level: privacyPost,
  media_urls: string[],
  authorId: string
): Promise<Post> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .update({ content, privacy_level, media_urls })
    .eq("id", postId)
    .eq("author_id", authorId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`);
  }

  await postCache.invalidatePost(postId);
  await feedCache.invalidateAllFeeds();

  return data;
}
