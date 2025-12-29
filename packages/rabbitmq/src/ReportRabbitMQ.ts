import RabbitMQClient from "./rabbitmq";
import { ReportJobPayload } from "@repo/shared/types/reportQueue";

/**
 * ReportRabbitMQ handles all report-related queue operations
 */
class ReportRabbitMQ extends RabbitMQClient {
  constructor() {
    super({
      publisherPrefetch: 10,
      consumerPrefetch: 5,
      exchanges: [{ name: "reports", type: "topic", durable: true }],
      queues: [
        { name: "report.check", durable: true, dlq: "report.check.dlq" },
      ],
      bindings: [
        { queue: "report.check", exchange: "reports", routingKey: "report.check" },
      ],
    });
  }

  /**
   * Publish a report check job to the queue
   */
  async publishReportCheck(payload: ReportJobPayload): Promise<boolean> {
    return await this.publishToExchange("reports", "report.check", payload);
  }

  /**
   * Consume report check jobs from the queue
   */
  async consumeReportCheck(
    callback: (payload: ReportJobPayload) => Promise<void>
  ): Promise<void> {
    return await this.consumeQueue("report.check", callback);
  }
}

// Singleton instance
let reportRabbitMQClient: ReportRabbitMQ | null = null;

export function getReportRabbitMQClient(): ReportRabbitMQ {
  if (!reportRabbitMQClient) {
    reportRabbitMQClient = new ReportRabbitMQ();
  }
  return reportRabbitMQClient;
}

export default ReportRabbitMQ;
