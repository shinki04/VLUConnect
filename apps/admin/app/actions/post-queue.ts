"use server";
import { getPostRabbitMQClient } from "@repo/rabbitmq/PostRabbitMQ";
import type {
  PostJobPayload,
  PostQueueItem,
  PostQueueOperations,
  PostQueueStatus,
  UpdatePostJobPayload,
} from "@repo/shared/types/postQueue";
import { createClient } from "@repo/supabase/server";

export type TCreateQueue = {
  userId: string;
  content: string;
  privacyLevel: "public" | "friends" | "private";
  mediaCount?: number;
  mediaUrls?: string[] | null;
  queueOperations?: PostQueueOperations;
};
/**
 * Create a new queue status entry when post is submitted
 */
export async function createQueueStatus({
  userId,
  content,
  privacyLevel,
  mediaCount,
  queueOperations,
}: TCreateQueue): Promise<PostQueueItem> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("post_queue_status")
    .insert({
      user_id: userId,
      status: "pending" as PostQueueStatus,
      content,
      privacy_level: privacyLevel,
      media_count: mediaCount,
      operation_type: queueOperations,
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
  const supabase = await createClient();

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
  const supabase = await createClient();

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
  const supabase = await createClient();

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
  const supabase = await createClient();

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

interface MediaFile {
  name: string;
  mimeType: string;
  data: string; // base64 encoded
  size: number;
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

// ============================ publish to RabbitMQ ==========================
/**
 * Publish a post creation job to the queue
 */

export async function queuePostCreation(payload: PostJobPayload) {
  const rabbitMQ = getPostRabbitMQClient();

  if (!rabbitMQ.isReady()) {
    await rabbitMQ.connect();
  }

  if (!payload) throw new Error("Payload is null or undefined");

  return await rabbitMQ.publishPostCreate(payload as PostJobPayload);
}

export async function queuePostUpdate(payload: UpdatePostJobPayload) {
  const rabbitMQ = getPostRabbitMQClient();
  if (!rabbitMQ.isReady()) {
    await rabbitMQ.connect();
  }

  if (!payload) throw new Error("Payload is null or undefined");

  return await rabbitMQ.publishPostUpdate(payload);
}
