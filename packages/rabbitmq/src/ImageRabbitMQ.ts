import RabbitMQClient from "./rabbitmq";

class ImageRabbitMQ extends RabbitMQClient {
  constructor() {
    super({
      publisherPrefetch: 10,
      consumerPrefetch: 5,
      exchanges: [{ name: "posts", type: "topic", durable: true }],
      queues: [
        { name: "post.create", durable: true, dlq: "post.create.dlq" },
        { name: "post.update", durable: true, dlq: "post.update.dlq" },
        { name: "post.delete", durable: true, dlq: "post.delete.dlq" },
      ],
      bindings: [
        { queue: "post.create", exchange: "posts", routingKey: "post.create" },
        { queue: "post.update", exchange: "posts", routingKey: "post.update" },
        { queue: "post.delete", exchange: "posts", routingKey: "post.delete" },
      ],
    });
  }

  // ========== Post Create Operations ==========

  /**
   * Publish a post creation job to the queue
   */
  async publishPostCreate(payload: Record<string, unknown>): Promise<boolean> {
    return await this.publishToExchange("posts", "post.create", payload);
  }

  /**
   * Consume post creation jobs from the queue
   */
  async consumePostCreate(
    callback: (payload: Record<string, unknown>) => Promise<void>
  ): Promise<void> {
    return await this.consumeQueue("post.create", callback);
  }

  // ========== Post Update Operations ==========

  /**
   * Publish a post update job via exchange
   */
  async publishPostUpdate(payload: Record<string, unknown>): Promise<boolean> {
    return await this.publishToExchange("posts", "post.update", payload);
  }

  /**
   * Consume post update jobs from the queue
   */
  async consumePostUpdate(
    callback: (payload: Record<string, unknown>) => Promise<void>
  ): Promise<void> {
    return await this.consumeQueue("post.update", callback);
  }

  // ========== Post Delete Operations ==========

  /**
   * Publish a post delete job via exchange
   */
  async publishPostDelete(payload: Record<string, unknown>): Promise<boolean> {
    return await this.publishToExchange("posts", "post.delete", payload);
  }

  /**
   * Consume post delete jobs from the queue
   */
  async consumePostDelete(
    callback: (payload: Record<string, unknown>) => Promise<void>
  ): Promise<void> {
    return await this.consumeQueue("post.delete", callback);
  }
}

// Singleton instance for ImageRabbitMQ
let imageRabbitMQClient: ImageRabbitMQ | null = null;

export function getImageRabbitMQClient(): ImageRabbitMQ {
  if (!imageRabbitMQClient) {
    imageRabbitMQClient = new ImageRabbitMQ();
  }
  return imageRabbitMQClient;
}

export function setImageRabbitMQClient(client: ImageRabbitMQ): void {
  imageRabbitMQClient = client;
}

export default ImageRabbitMQ;
