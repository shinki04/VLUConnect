import { NotificationType } from "@repo/shared/types/notification";
import {  ModerationStatus, Post } from "@repo/shared/types/post";
import {
  PostJobPayload,
  PostQueueDeletePayload,
  PostQueueItem,
  PostQueueStatus,
  SentimentResult,
  UpdatePostJobPayload,
} from "@repo/shared/types/postQueue";
import { createServiceClient } from "@repo/supabase/service";
import { urlToPath } from "@repo/utils/getPathSupabase";

import { sentimentModel } from "../models/sentimentModel";
import {
  removeHashtagsForPost,
  saveHashtagsFromContent,
  syncHashtagsForPost,
} from "./hashtag";
import { checkBlockedKeywords } from "./keyword";

export async function deletePost(postId: string): Promise<void> {
  const supabase = createServiceClient();

  // Clean up hashtags before deleting post
  try {
    await removeHashtagsForPost(postId);
  } catch (hashtagError) {
    console.error("⚠️  Error removing hashtags:", hashtagError);
    // Continue with delete even if hashtag cleanup fails
  }

  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }
}

export async function updatePost(
  payload: PostJobPayload & { post_id: string }
): Promise<Post> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("posts")
    .update({
      id: payload.post_id,
      content: payload.content,
      media_urls: payload.media_urls,
      author_id: payload.userId,
      updated_at: Date.now().toString(),
    })
    .eq("id", payload.post_id)
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


    let moderationStatus: ModerationStatus = "approved";
    let moderationReason: string | null = null;
    let keywordMatch: string | null = null;
    let aiScore = 0;
    let aiLabel = "NEU";
    let sentimentResults: SentimentResult[] = [];

    // Step 0: Check blocked keywords
    const matchedKeyword = await checkBlockedKeywords(payload.content, payload.groupId || undefined);

    if (matchedKeyword) {
      console.log(`🚫 Keyword matched in post: "${matchedKeyword}"`);
      moderationStatus = "rejected";
      moderationReason = `Bài viết chứa từ khóa bị chặn: "${matchedKeyword}"`;
      keywordMatch = matchedKeyword;
    } else {
      // Step 1: Using AI for sentiment check ONLY if no keyword block
      const sentiment = await sentimentModel(payload.content);
      // console.log("Sentiment: ", sentiment);
      if (sentiment.length === 0) {
        throw new Error("Failed to get sentiment");
      }
      sentimentResults = sentiment;

      // Find NEG sentiment score
      const negSentiment = sentiment.find((s) => s.label === "NEG");
      const negScore = negSentiment?.score ?? 0;
      aiScore = negScore;
      aiLabel = sentiment[0]?.label || "UNKNOWN";

      // Determine moderation status based on NEG score
      if (negScore >= 0.9) {
        moderationStatus = "rejected";
        moderationReason = `AI đã phát hiện nội dung tiêu cực với độ tin cậy ${(negScore * 100).toFixed(1)}%`;
        console.log(`🚫 Post rejected: NEG score ${negScore}`);
      } else if (negScore > 0.7) {
        moderationStatus = "flagged";
        console.log(`⚠️ Post flagged: NEG score ${negScore}`);
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
        media_urls: payload.media_urls || [],
        moderation_status: moderationStatus,
        is_anonymous: payload.isAnonymous ?? false,
        ...(moderationReason && { moderation_reason: moderationReason }),
        ...(payload.groupId && { group_id: payload.groupId }),
      })
      .select()
      .single();

    if (error || !post) {
      // Update status to 'failed' with error message
      if (payload.queueId) {
        await updateQueueStatus(
          payload.queueId,
          "failed",
          undefined,
          `Failed to create post: ${error?.message || "Unknown error"}`
        );
      }
      throw new Error(`Failed to create post: ${error?.message || "Unknown error"}`);
    }

    console.log("✅ Post created successfully:", post.id);

    // Step 2.1: Log Moderation Actions
    if (keywordMatch) {
      await supabase.from("moderation_actions").insert({
        target_type: "post",
        target_id: post.id,
        action_type: "keyword_blocked",
        reason: moderationReason!,
        matched_keyword: keywordMatch,
        created_by: null, // System
      });
    } else if (moderationStatus === "rejected" || moderationStatus === "flagged") {
      // Log AI action
      await (supabase.from("moderation_actions")).insert({
        target_type: "post",
        target_id: post.id,
        action_type: "ai_flagged",
        reason: moderationReason || (moderationStatus === "flagged" ? "AI flagged potential issue" : "AI rejected content"),
        ai_score: aiScore,
        created_by: null, // System
      });
    }

    // Step 2.5: Save AI analysis to logs
    try {
      await supabase.from("ai_analysis_logs").insert({
        target_type: "post",
        target_id: post.id,
        model_name: matchedKeyword ? "keyword_filter" : "5CD-AI/Vietnamese-Sentiment-visobert",
        analysis_type: matchedKeyword ? "keyword_match" : "sentiment",
        label: matchedKeyword ? "BLOCKED" : aiLabel,
        score: matchedKeyword ? 1.0 : (sentimentResults[0]?.score || 0),
        confidence: matchedKeyword ? 1.0 : aiScore,
        metadata: {
          all_labels: sentimentResults,
          matched_keyword: matchedKeyword
        },
      });
      console.log("📊 Analysis logged for post:", post.id);
    } catch (logError) {
      console.error("⚠️ Failed to log AI analysis:", logError);
      // Don't fail post creation if logging fails
    }

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

    // Save notification
    const { error: notificationError } = await supabase.from("notifications").insert({
      recipient_id: payload.userId,
      sender_id: null,
      entity_type: "post_created" as NotificationType,
      entity_id: post.id,
      title: "Bài viết đã được tạo",
      message: "Bài viết của bạn đã được tạo thành công",
      type: "post" as NotificationType,
    });
    if (notificationError) {
      console.error("⚠️ Failed to save notification:", notificationError);
    }

    // Update status to 'completed' with post ID
    if (payload.queueId) {
      await updateQueueStatus(payload.queueId, "completed", post.id);
    }



    console.log("🎉 Post processing completed successfully");
    // await deleteQueueStatus(payload.queueId!);
    return post;
  } catch (error) {
    console.error("❌ Error processing post creation:", error);
    throw error;
  }
}

/**
 * Process post update job from queue
 * Handles post update + hashtag extraction + queue status updates
 */
export async function processPostUpdate(payload: UpdatePostJobPayload) {
  const supabase = createServiceClient();

  try {
    // console.log(
    //   `🔄 Processing post update for user: ${payload.userId}, media: ${payload.media.length} files`
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
      .update({
        content: payload.content,
        privacy_level: payload.privacyLevel,
        media_urls: payload.media_urls || [],
      })
      .eq("id", payload.postId)
      .eq("author_id", payload.userId)
      .select()
      .single();

    if (error) {
      // Update status to 'failed' with error message
      if (payload.queueId) {
        await updateQueueStatus(
          payload.queueId,
          "failed",
          undefined,
          `Failed to update post: ${error.message}`
        );
      }
      throw new Error(`Failed to update post: ${error.message}`);
    }

    console.log("✅ Post updated successfully:", post.id);

    // Step 3: Sync hashtags (remove old, add new)
    try {
      const hashtags = await syncHashtagsForPost(payload.content, post.id);
      if (hashtags.length > 0) {
        console.log(`✅ Synced ${hashtags.length} new hashtags for post`);
      }
    } catch (hashtagError) {
      console.error("⚠️  Error syncing hashtags:", hashtagError);
      // Don't fail the post update if hashtags fail
    }

    // Update status to 'completed' with post ID
    if (payload.queueId) {
      await updateQueueStatus(payload.queueId, "completed", post.id);
    }

    console.log("🎉 Post updated processing completed successfully");
    await deleteQueueStatus(payload.queueId!);
    return post;
  } catch (error) {
    console.error("❌ Error processing post update:", error);
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

/**
 * Delete Post Media
 */
export async function deletePostMedia(
  payload: PostQueueDeletePayload
): Promise<void> {
  const supabase = createServiceClient();
  const media_paths = payload.media_urls
    .map((i) => urlToPath(i, "posts"))
    .filter((p): p is string => Boolean(p));
  console.log("MEDIA PATH", media_paths);
  const { error } = await supabase.storage.from("posts").remove(media_paths);
  if (error) {
    console.error("Failed to fetch queue status by ID:", error);
    throw new Error(`Failed to delete post media: ${error.message}`);
  }
}
