import { Enums, Tables } from "./database.types";
import { Post } from "./post";

export type PostQueueStatus = Enums<"queue_status">;

export type PostQueueItem = Tables<"post_queue_status">;

export interface OptimisticPost extends Omit<Post, "id"> {
  id: string; // Temporary ID from queue
  isOptimistic: true;
  queueStatus: PostQueueStatus;
}
