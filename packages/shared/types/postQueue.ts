import { Enums, Tables } from "./database.types.js";
import { Post, privacyPost } from "./post.js";

export type PostQueueStatus = Enums<"queue_status">;

export type PostQueueItem = Tables<"post_queue_status"> & {
  group_id?: string | null;
};
export type PostQueueOperations = Enums<"sql_operation">;

export interface OptimisticPost extends Omit<Post, "id"> {
  id: string; // Temporary ID from queue
  isOptimistic: true;
  queueStatus: PostQueueStatus;
}
export interface PostJobPayload {
  userId: string;
  content: string;
  privacyLevel: privacyPost;
  media_urls?: string[] | null;
  queueId: string; // Track queue status ID
  queueStatus?: PostQueueStatus;
  queueOperations?: PostQueueOperations;
  groupId?: string | null; // Group ID for group posts
  isAnonymous?: boolean; // Anonymous posting flag
}


export interface UpdatePostJobPayload {
  userId: string;
  postId: string;
  content: string;
  privacyLevel: privacyPost;
  media_urls?: string[] | null;
  queueId?: string; // Track queue status ID
  queueStatus: PostQueueStatus;
  queueOperations: PostQueueOperations;
}

export interface PostQueueDeletePayload {
  media_urls: string[];
  queueId?: string;
}

export type SentimentResult = {
  label: string;
  score: number;
};
