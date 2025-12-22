"use server";
import { getPostRabbitMQClient } from "@repo/rabbitmq/PostRabbitMQ";
import { getCacheInvalidationService } from "@repo/redis/cacheInvalidationService";
import { getFeedCacheService } from "@repo/redis/feedCacheService";
import { getPostCacheService } from "@repo/redis/postCacheService";
import { getRedisClient } from "@repo/redis/redis";
import { Post, PostResponse, privacyPost } from "@repo/shared/types/post";
import { PostQueueDeletePayload } from "@repo/shared/types/postQueue";
import { createClient } from "@repo/supabase/server";

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

const redis = getRedisClient();
const feedCache = getFeedCacheService();
const postCache = getPostCacheService();
const cacheInvalidation = getCacheInvalidationService();

export async function fetchPosts(
  page: number,
  itemsPerPage: number,
  userId: string = "public" // For future use with user-specific feeds
) {
  // Try cache first
  // const cachedFeed = await feedCache.getCachedFeedPage(userId, page, itemsPerPage);
  // if (cachedFeed) {
  //   return {
  //     posts: cachedFeed.posts as PostResponse[],
  //     hasMore: cachedFeed.hasMore,
  //     total: cachedFeed.total,
  //     currentPage: cachedFeed.page,
  //   };
  // }

  const supabase = await createClient();

  // Validate page number
  if (page < 1) {
    throw new Error("Page number must be greater than 0");
  }

  const offset = (page - 1) * itemsPerPage;

  // Get total count
  const { count, error: countError } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

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
      author: author_id(
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
      `
    )
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

  // Cache the feed page
  // await feedCache.setCachedFeedPage(userId, page, itemsPerPage, {
  //   posts: data || [],
  //   page,
  //   hasMore,
  //   total,
  //   itemsPerPage,
  // });

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
    // Use cache service with stampede protection
    // const post = await postCache.getCachedOrFetch(postId, async () => {
    //   const supabase = await createClient();
    //   const { data, error } = await supabase
    //     .from("posts")
    //     .select(
    //       `
    //       id,
    //       created_at,
    //       author: author_id(
    //         id,
    //         username,
    //         display_name,
    //         avatar_url,
    //         global_role
    //       ),
    //       content,
    //       media_urls,
    //       updated_at,
    //       like_count,
    //       comment_count,
    //       share_count,
    //       privacy_level
    //       `
    //     )
    //     .eq("id", postId)
    //     .single();

    //   if (error) {
    //     throw new Error(`Failed to fetch post: ${error.message}`);
    //   }
    //   return data;
    // });
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
          id,
          created_at, 
          author: author_id(
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
          `
      )
      .eq("id", postId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch post: ${error.message}`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isLikedByViewer = false;
    if (user && data) {
      const { data: like } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .single();
      isLikedByViewer = !!like;
    }

    return {
      ...data,
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
      author: author_id(
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
  authorId: string
): Promise<void> {
  const supabase = await createClient();
  const postRabbitMQClient = getPostRabbitMQClient();
  if (!postRabbitMQClient.isReady()) {
    await postRabbitMQClient.connect();
  }
  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", authorId)
    .select();

  if (error || !data) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }
  const post = data[0];
  if (post) {
    if (post.media_urls) {
      const payload: PostQueueDeletePayload = {
        media_urls: post.media_urls,
        queueId: post.id,
      };
      await postRabbitMQClient.publishPostDelete(payload);
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

  return data;
}
