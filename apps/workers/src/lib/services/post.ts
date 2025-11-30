import { createServiceClient } from "../supabase/services_roles";
import { Post, PostResponse } from "@repo/shared/types/post";
import { getPostRabbitMQClient } from "@repo/rabbitmq/PostRabbitMQ";
import { PostQueueItem, PostQueueStatus } from "@repo/shared/types/postQueue";
import { saveHashtagsFromContent } from "./hashtag";
import { privacyPost } from "@repo/shared/types/post";

export interface CreatePostInput {
  content: string;
  privacy_level: "public" | "friends" | "private";
  media: File[];
}

export interface CreatePostResponse {
  post: Post;
  mediaUrls: string[];
}

export async function uploadPostImages(
  files: File[],
  userId: string
): Promise<string[]> {
  const supabase = createServiceClient();

  const uploadedUrls: string[] = [];

  for (const file of files) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("posts")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("posts").getPublicUrl(fileName);

    uploadedUrls.push(publicUrl);
  }

  return uploadedUrls;
}

export async function createPost(
  input: CreatePostInput,
  userId: string
): Promise<CreatePostResponse> {
  const supabase = createServiceClient();

  // Upload media files first
  const mediaUrls = await uploadPostImages(input.media, userId);

  // Create post in database
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: userId,
      content: input.content,
      privacy_level: input.privacy_level,
      media_urls: mediaUrls,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }

  return {
    post: data,
    mediaUrls,
  };
}
export interface FetchPostsResponse {
  posts: PostResponse[];
  hasMore: boolean;
  total: number;
  currentPage: number;
}

export async function fetchPosts(
  page: number,
  itemsPerPage: number
): Promise<FetchPostsResponse> {
  const supabase = createServiceClient();

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

  // Check if there are more posts after current page
  const hasMore = offset + itemsPerPage < total;

  return {
    posts: data || [],
    hasMore,
    total,
    currentPage: page,
  };
}

export async function fetchPostById(postId: string): Promise<Post | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("posts")
    .select()
    .eq("id", postId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows found
      return null;
    }
    throw new Error(`Failed to fetch post: ${error.message}`);
  }

  return data;
}

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

interface MediaFile {
  name: string;
  mimeType: string;
  data: string; // base64 encoded
  size: number;
}

export interface PostCreateJobPayload {
  userId: string;
  content: string;
  privacyLevel: "public" | "friends" | "private";
  media: MediaFile[]; // Changed from mediaUrls to media with base64
  queueId?: string; // Track queue status ID
}

/**
 * Convert File to base64 for transmission over queue
 * Works in both browser and Node.js environments
 */
async function fileToBase64(file: File): Promise<string> {
  // In Node.js (server-side): convert ArrayBuffer to base64
  if (file instanceof File && typeof window === "undefined") {
    const buffer = await file.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  }

  // In browser: use FileReader
  if (typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64!);
      };
      reader.onerror = reject;
    });
  }

  throw new Error("Cannot process file in current environment");
}

/**
 * Convert base64 back to File for processing
 */
function base64ToFile(base64: string, name: string, mimeType: string): File {
  const byteString = atob(base64);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return new File([byteArray], name, { type: mimeType });
}

/**
 * Publish a post creation job to the queue
 * Now includes media files as base64 and creates queue status entry
 */
export async function queuePostCreation(
  userId: string,
  content: string,
  privacyLevel: privacyPost,
  mediaFiles: File[] = [],
  queueId?: string
) {
  const rabbitMQ = getPostRabbitMQClient();

  if (!rabbitMQ.isReady()) {
    await rabbitMQ.connect();
  }

  // Convert files to base64
  const encodedMedia: MediaFile[] = [];
  for (const file of mediaFiles) {
    const base64Data = await fileToBase64(file);
    encodedMedia.push({
      name: file.name,
      mimeType: file.type,
      data: base64Data,
      size: file.size,
    });
  }

  const payload: PostCreateJobPayload = {
    userId,
    content,
    privacyLevel,
    media: encodedMedia,
    queueId, // Include queue ID for tracking
  };

  console.log(`📤 Queueing post with ${encodedMedia.length} files`);
  console.log(`Queue ID ${queueId}`);
  return await rabbitMQ.publishPostCreate(
    payload as unknown as Record<string, unknown>
  );
}

/**
 * Process post creation job from queue
 * Handles file upload + post creation + hashtag extraction + queue status updates
 */
export async function processPostCreation(payload: PostCreateJobPayload) {
  const supabase = createServiceClient();

  try {
    console.log(
      `🔄 Processing post creation for user: ${payload.userId}, media: ${payload.media.length} files`
    );

    // Update status to 'processing'
    if (payload.queueId) {
      await updateQueueStatus(payload.queueId, "processing");
    }

    // Step 1: Upload files to Supabase Storage
    let mediaUrls: string[] = [];
    if (payload.media.length > 0) {
      try {
        console.log("📤 Uploading files to Supabase Storage...");

        // Reconstruct File objects from base64
        const filesToUpload = payload.media.map((media) =>
          base64ToFile(media.data, media.name, media.mimeType)
        );

        mediaUrls = await uploadPostImages(filesToUpload, payload.userId);
        console.log(`✅ Uploaded ${mediaUrls.length} files`);
      } catch (uploadError) {
        console.error("❌ Error uploading files:", uploadError);
        const errorMessage =
          uploadError instanceof Error ? uploadError.message : "Unknown error";

        // Update status to 'failed' with error message
        if (payload.queueId) {
          await updateQueueStatus(
            payload.queueId,
            "failed",
            undefined,
            `Failed to upload files: ${errorMessage}`
          );
        }

        throw new Error(`Failed to upload files: ${errorMessage}`);
      }
    }

    // Step 2: Create post in database
    console.log("📝 Creating post in database...");
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        author_id: payload.userId,
        content: payload.content,
        privacy_level: payload.privacyLevel,
        media_urls: mediaUrls || [],
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
