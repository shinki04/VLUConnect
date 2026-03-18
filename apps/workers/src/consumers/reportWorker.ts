import { getReportRabbitMQClient } from "@repo/rabbitmq/ReportRabbitMQ";
import { ReportJobPayload } from "@repo/shared/types/reportQueue";

import { processReportCheck } from "@/lib/services/report";

/**
 * Worker process that consumes report check messages from RabbitMQ queue
 */
export async function startReportWorker() {
  console.log("Starting Report Worker...");
  
  try {
    const rabbitMQ = getReportRabbitMQClient();

    if (!rabbitMQ.isReady()) {
      console.log("Connecting to RabbitMQ...");
      await rabbitMQ.connect();
    }

    // Start consuming report check jobs
    await rabbitMQ.consumeReportCheck(async (payload: ReportJobPayload) => {
      console.log(`Processing report check for: ${payload.reportedType}:${payload.reportedId}`);
      
      try {
        const result = await processReportCheck(payload);
        console.log(`Report check completed:`, result);
      } catch (error) {
        console.error("Report check failed:", error);
        throw error;
      }
    });

    console.log("Report Worker ready and listening for jobs...");

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\nShutting down Report Worker...");
      await rabbitMQ.close();
    });
  } catch (error) {
    console.error("Failed to start Report Worker:", error);
    throw error;
  }
}
