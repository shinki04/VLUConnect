import RabbitMQClient from "./rabbitmq";

/**
 * PostRabbitMQ handles all post-related queue operations
 * Uses configuration-based approach for cleaner, more maintainable code
 */
class PostRabbitMQ extends RabbitMQClient {
  constructor() {
    super({
      prefetch: 1,
      exchanges: [
        { name: "posts", type: "direct", durable: true }
      ],
      queues: [
        { name: "post.create", durable: true, dlq: "post.create.dlq" },
        { name: "post.update", durable: true, dlq: "post.update.dlq" },
        { name: "post.delete", durable: true, dlq: "post.delete.dlq" }
      ],
      bindings: [
        { queue: "post.create", exchange: "posts", routingKey: "post.create" },
        { queue: "post.update", exchange: "posts", routingKey: "post.update" },
        { queue: "post.delete", exchange: "posts", routingKey: "post.delete" }
      ]
    });
  }

  // ========== Post Create Operations ==========

  /**
   * Publish a post creation job to the queue
   */
  async publishPostCreate(payload: Record<string, unknown>): Promise<boolean> {
    return await this.publishToQueue("post.create", payload);
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

// Singleton instance for PostRabbitMQ
let postRabbitMQClient: PostRabbitMQ | null = null;

export function getPostRabbitMQClient(): PostRabbitMQ {
  if (!postRabbitMQClient) {
    postRabbitMQClient = new PostRabbitMQ();
  }
  return postRabbitMQClient;
}

export function setPostRabbitMQClient(client: PostRabbitMQ): void {
  postRabbitMQClient = client;
}

export default PostRabbitMQ;
