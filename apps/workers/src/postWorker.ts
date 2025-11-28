// import { getPostRabbitMQClient } from "@/lib/rabbitmq/PostRabbitMQ";
// import {
//   processPostCreation,
//   PostCreateJobPayload,
// } from "@/services/postQueueService";
// import { config } from "dotenv";
// import { resolve } from "path";

// config({ path: resolve(process.cwd(), ".env.local") });

// /**
//  * Worker process that consumes messages from RabbitMQ queue
//  */
// export async function startPostWorker() {
//   console.log("🚀 Starting Post Worker...");
//   try {
//     const rabbitMQ = getPostRabbitMQClient();

//     if (!rabbitMQ.isReady()) {
//       console.log("📡 Connecting to RabbitMQ...");
//       await rabbitMQ.connect();
//     }
//     // Start consuming jobs
//     await rabbitMQ.consumePostCreate(
//       async (payload: Record<string, unknown>) => {
//         const typedPayload = payload as unknown as PostCreateJobPayload;
//         console.log("🔄 Processing job for user:", typedPayload.userId);
//         try {
//           const post = await processPostCreation(typedPayload);
//           console.log("✅ Job completed. Post ID:", post.id);
//         } catch (error) {
//           console.error("❌ Job failed:", error);
//           throw error;
//         }
//       }
//     );
//     console.log("✅ Post Worker ready and listening for jobs...");
//     // Graceful shutdown
//     process.on("SIGINT", async () => {
//       console.log("\n🛑 Shutting down worker...");
//       await rabbitMQ.close();
//       process.exit(0);
//     });
//   } catch (error) {
//     console.error("❌ Failed to start worker:", error);
//     process.exit(1);
//   }
// }
// console.log("WORKER", process.argv[1]);
// // Start the worker if run directly
// // if (import.meta.url === `file://${process.argv[1]}`) {
// //   startPostWorker().catch(console.error);
// // }
// startPostWorker().catch(console.error);
