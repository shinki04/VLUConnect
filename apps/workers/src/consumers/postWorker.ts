import { getPostRabbitMQClient } from "@repo/rabbitmq/PostRabbitMQ";
import {
  PostJobPayload,
  PostQueueDeletePayload,
  UpdatePostJobPayload,
} from "@repo/shared/types/postQueue";

import {
  deletePost,
  deletePostMedia,
  processPostCreation,
  processPostUpdate,
} from "@/lib/services/post";

// config({ path: resolve(process.cwd(), ".env.local") });

/**
 * Worker process that consumes messages from RabbitMQ queue
 */
export async function startPostWorker() {
  console.log("Starting Post Worker...");
  try {
    const rabbitMQ = getPostRabbitMQClient();

    if (!rabbitMQ.isReady()) {
      console.log("Connecting to RabbitMQ...");
      await rabbitMQ.connect();
    }
    // Start consuming jobs
    await rabbitMQ.consumePostCreate(async (payload: PostJobPayload) => {
      console.log("Processing job for user:", payload.userId);
      try {
        const post = await processPostCreation(payload);
        console.log("Job completed. Post ID:", post.id);
      } catch (error) {
        console.error("Job failed:", error);
        throw error;
      }
    });
    await rabbitMQ.consumePostUpdate(async (payload: UpdatePostJobPayload) => {
      console.log("Processing update job for user:", payload.userId);
      try {
        const post = await processPostUpdate(payload);
        console.log("Update job completed. Post ID:", post.id);
      } catch (error) {
        console.error("Update job failed:", error);
        throw error;
      }
    });

    await rabbitMQ.consumePostDelete(
      async (payload: PostQueueDeletePayload) => {
        await deletePostMedia(payload);

        console.log("Processing delete job for post:", payload.queueId);
        if (payload.queueId) {
          await deletePost(payload.queueId);
          console.log("Database deletion completed for post:", payload.queueId);
        }
      }
    );

    console.log("Post Worker ready and listening for jobs...");
    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\nShutting down worker...");
      await rabbitMQ.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start worker:", error);
    process.exit(1);
  }
}
// Start the worker if run directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   startPostWorker().catch(console.error);
// }
// startPostWorker().catch(console.error);
