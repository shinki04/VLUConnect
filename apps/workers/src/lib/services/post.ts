import { createServiceClient } from "../supabase/services_roles";
import { Post, PostResponse } from "@repo/shared/types/post";
import { getPostRabbitMQClient } from "@repo/rabbitmq/PostRabbitMQ";
import {
  PostJobPayload,
  PostQueueItem,
  PostQueueStatus,
} from "@repo/shared/types/postQueue";
import { saveHashtagsFromContent } from "./hashtag";
import { privacyPost } from "@repo/shared/types/post";

export async function deletePost(postId: string): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }
}

export async function updatePost(
  postId: string,
  content: string,
  privacy_level: "public" | "friends" | "private"
): Promise<Post> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("posts")
    .update({ content, privacy_level })
    .eq("id", postId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`);
  }

  return data;
}

/**
 * Process post creation job from queue
 * Handles file upload + post creation + hashtag extraction + queue status updates
 */
export async function processPostCreation(payload: PostJobPayload) {
  const supabase = createServiceClient();

  try {
    // console.log(
    //   `🔄 Processing post creation for user: ${payload.userId}, media: ${payload.media.length} files`
    // );

    // Update status to 'processing'
    if (payload.queueId) {
      await updateQueueStatus(payload.queueId, "processing");
    }

    // Step 1: Using AI for check

    // Step 2: Create post in database
    console.log("📝 Creating post in database...");
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        author_id: payload.userId,
        content: payload.content,
        privacy_level: payload.privacyLevel,
        media_urls: payload.media_urls || [],
      })
      .select()
      .single();

    if (error) {
      // Update status to 'failed' with error message
      if (payload.queueId) {
        await updateQueueStatus(
          payload.queueId,
          "failed",
          undefined,
          `Failed to create post: ${error.message}`
        );
      }
      throw new Error(`Failed to create post: ${error.message}`);
    }

    console.log("✅ Post created successfully:", post.id);

    // Step 3: Extract and save hashtags
    try {
      const hashtags = await saveHashtagsFromContent(payload.content, post.id);
      if (hashtags.length > 0) {
        console.log(`✅ Saved ${hashtags.length} hashtags for post`);
      }
    } catch (hashtagError) {
      console.error("⚠️  Error saving hashtags:", hashtagError);
      // Don't fail the post creation if hashtags fail
    }

    // Update status to 'completed' with post ID
    if (payload.queueId) {
      await updateQueueStatus(payload.queueId, "completed", post.id);
    }

    console.log("🎉 Post processing completed successfully");
    return post;
  } catch (error) {
    console.error("❌ Error processing post creation:", error);
    throw error;
  }
}

/**
 * Create a new queue status entry when post is submitted
 */
export async function createQueueStatus(
  userId: string,
  content: string,
  privacyLevel: "public" | "friends" | "private",
  mediaCount: number
): Promise<PostQueueItem> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("post_queue_status")
    .insert({
      user_id: userId,
      status: "pending" as PostQueueStatus,
      content,
      privacy_level: privacyLevel,
      media_count: mediaCount,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create queue status: ${error.message}`);
  }

  return data as PostQueueItem;
}

/**
 * Update queue status as post processes
 */
export async function updateQueueStatus(
  queueId: string,
  status: PostQueueStatus,
  postId?: string,
  errorMessage?: string
): Promise<PostQueueItem | null> {
  const supabase = await createServiceClient();

  const updateData: {
    status: PostQueueStatus;
    updated_at: string;
    post_id?: string;
    error_message?: string;
    retry_count?: number;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (postId) {
    updateData.post_id = postId;
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  if (status === "failed") {
    // Increment retry count on failure
    const { data: current } = await supabase
      .from("post_queue_status")
      .select("retry_count")
      .eq("id", queueId)
      .single();

    if (current) {
      updateData.retry_count = (current.retry_count || 0) + 1;
    }
  }

  const { data, error } = await supabase
    .from("post_queue_status")
    .update(updateData)
    .eq("id", queueId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update queue status:", error);
    return null;
  }

  return data as PostQueueItem;
}

/**
 * Get all pending/processing queue items for a user
 */
export async function getQueueStatusByUser(
  userId: string
): Promise<PostQueueItem[]> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("post_queue_status")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch queue status:", error);
    return [];
  }

  return (data as PostQueueItem[]) || [];
}

/**
 * Delete queue status entry (for cleanup)
 */
export async function deleteQueueStatus(queueId: string): Promise<void> {
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from("post_queue_status")
    .delete()
    .eq("id", queueId);

  if (error) {
    console.error("Failed to delete queue status:", error);
  }
}

/**
 * Get specific queue item by ID
 */
export async function getQueueStatusById(
  queueId: string
): Promise<PostQueueItem | null> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("post_queue_status")
    .select("*")
    .eq("id", queueId)
    .single();

  if (error) {
    console.error("Failed to fetch queue status by ID:", error);
    return null;
  }

  return data as PostQueueItem;
}
