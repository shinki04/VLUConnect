import { Enums, Tables } from "./database.types.js";
import { Post, privacyPost } from "./post.js";

export type PostQueueStatus = Enums<"queue_status">;

export type PostQueueItem = Tables<"post_queue_status">;

export interface OptimisticPost extends Omit<Post, "id"> {
  id: string; // Temporary ID from queue
  isOptimistic: true;
  queueStatus: PostQueueStatus;
}
export interface PostJobPayload {
  userId: string;
  content: string;
  privacyLevel: privacyPost;
  media_urls?: string[];
  queueId: string; // Track queue status ID
  queueStatus?: PostQueueStatus;
}
