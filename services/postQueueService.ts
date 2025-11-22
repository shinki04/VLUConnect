import { getRabbitMQClient } from "@/lib/rabbitmq/rabbitmq";
import { createClient } from "@/lib/supabase/client";
import { saveHashtagsFromContent } from "@/services/hashtagService";
import { uploadPostImages } from "@/services/postService";
import { privacyPost } from "@/types/post";

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
        resolve(base64);
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
 * Now includes media files as base64
 */
export async function queuePostCreation(
  userId: string,
  content: string,
  privacyLevel: privacyPost,
  mediaFiles: File[] = []
) {
  const rabbitMQ = getRabbitMQClient();

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
  };

  console.log(`📤 Queueing post with ${encodedMedia.length} files`);

  return await rabbitMQ.publishPostCreateJob(
    payload as unknown as Record<string, unknown>
  );
}

/**
 * Process post creation job from queue
 * Handles file upload + post creation + hashtag extraction
 */
export async function processPostCreation(payload: PostCreateJobPayload) {
  const supabase = await createClient();

  try {
    console.log(
      `🔄 Processing post creation for user: ${payload.userId}, media: ${payload.media.length} files`
    );

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
        throw new Error(
          `Failed to upload files: ${
            uploadError instanceof Error ? uploadError.message : "Unknown error"
          }`
        );
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

    console.log("🎉 Post processing completed successfully");
    return post;
  } catch (error) {
    console.error("❌ Error processing post creation:", error);
    throw error;
  }
}
