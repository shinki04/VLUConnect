import amqplib, { Channel } from "amqplib";

interface QueueConfig {
  name: string;
  durable?: boolean;
  dlq?: string; // Dead Letter Queue name
}
interface ExchangeConfig {
  name: string;
  type: "direct" | "topic" | "fanout" | "headers";
  durable?: boolean;
}
interface BindingConfig {
  queue: string;
  exchange: string;
  routingKey: string;
}

interface RabbitMQConfig {
  url?: string;
  prefetch?: number;
  exchanges?: ExchangeConfig[];
  queues?: QueueConfig[];
  bindings?: BindingConfig[];
}

// Custom type for RabbitMQ connection with proper methods
type RabbitMQConnection = {
  createChannel(): Promise<Channel>;
  close(): Promise<void>;
  on(event: "close", listener: () => void): void;
  on(event: "error", listener: (err: Error) => void): void;
};

class RabbitMQClient {
  private channel: Channel | null = null;
  private connection: RabbitMQConnection | null = null;
  private url: string;
  private prefetch: number;
  private isConnected: boolean = false;
  protected config: RabbitMQConfig;

  constructor(config: RabbitMQConfig = {}) {
    this.config = config;
    this.url =
      config.url ||
      process.env.RABBITMQ_URL ||
      "amqp://guest:guest@localhost:5672";
    this.prefetch = config.prefetch || 1;
  }

  async connect(): Promise<void> {
    try {
      this.connection = (await amqplib.connect(this.url)) as RabbitMQConnection;
      console.log("✅ Connected to RabbitMQ", this.url);

      this.channel = await this.connection.createChannel();
      console.log("✅ Channel created");

      // Set prefetch count
      await this.channel!.prefetch(this.prefetch);

      // Call setup hook for subclasses
      await this.setup();

      console.log("✅ RabbitMQ setup complete");

      this.isConnected = true;

      this.connection?.on("close", () => {
        console.log("⚠️  RabbitMQ connection closed");
        this.isConnected = false;
      });

      this.connection?.on("error", (err: Error) => {
        console.error("❌ RabbitMQ connection error:", err);
        this.isConnected = false;
      });
    } catch (error) {
      console.error("❌ RabbitMQ connection error:", error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Setup exchanges, queues, and bindings based on configuration
   * Can be extended/overridden by subclasses for custom logic
   */
  protected async setup(): Promise<void> {
    // 1. Assert all exchanges
    if (this.config.exchanges) {
      for (const exchange of this.config.exchanges) {
        await this.assertExchange(exchange.name, exchange.type, {
          durable: exchange.durable ?? true,
        });
      }
    }
    // 2. Assert all queues (including DLQs)
    if (this.config.queues) {
      for (const queue of this.config.queues) {
        // Assert the main queue
        await this.assertQueue(queue.name, {
          durable: queue.durable ?? true,
        });
        // Assert DLQ if specified
        if (queue.dlq) {
          await this.assertQueue(queue.dlq, {
            durable: true,
          });
        }
      }
    }
    // 3. Create all bindings
    if (this.config.bindings) {
      for (const binding of this.config.bindings) {
        await this.bindQueue(
          binding.queue,
          binding.exchange,
          binding.routingKey
        );
      }
    }
  }

  /**
   * Publish a message directly to a queue
   */
  public async publishToQueue(
    queue: string,
    payload: Record<string, unknown>,
    options?: {
      persistent?: boolean;
      contentType?: string;
    }
  ): Promise<boolean> {
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel not initialized. Call connect() first."
      );
    }
    const jobData = JSON.stringify(payload);
    const published = this.channel.sendToQueue(queue, Buffer.from(jobData), {
      persistent: options?.persistent ?? true,
      contentType: options?.contentType ?? "application/json",
    });
    if (published) {
      console.log(`📤 Message published to queue: ${queue}`);
      return true;
    } else {
      console.error(`❌ Failed to publish message to queue: ${queue}`);
      return false;
    }
  }

  /**
   * Publish a message to an exchange with a routing key
   */
  public async publishToExchange(
    exchange: string,
    routingKey: string,
    payload: Record<string, unknown>,
    options?: {
      persistent?: boolean;
      contentType?: string;
    }
  ): Promise<boolean> {
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel not initialized. Call connect() first."
      );
    }
    const jobData = JSON.stringify(payload);
    const published = this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(jobData),
      {
        persistent: options?.persistent ?? true,
        contentType: options?.contentType ?? "application/json",
      }
    );
    if (published) {
      console.log(
        `📤 Message published to exchange: ${exchange} with routing key: ${routingKey}`
      );
      return true;
    } else {
      console.error(
        `❌ Failed to publish message to exchange: ${exchange} with routing key: ${routingKey}`
      );
      return false;
    }
  }

  /**
   * Consume messages from a queue
   */
  public async consumeQueue(
    queue: string,
    callback: (payload: Record<string, unknown>) => Promise<void>,
    options?: {
      sendToDLQ?: boolean;
      dlqName?: string;
    }
  ): Promise<void> {
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel not initialized. Call connect() first."
      );
    }
    await this.channel.consume(queue, async (msg: amqplib.Message | null) => {
      if (msg) {
        try {
          const payload = JSON.parse(msg.content.toString());
          console.log(`📥 Processing message from queue: ${queue}`, payload);
          await callback(payload);
          // Acknowledge message
          this.channel!.ack(msg);
        } catch (error) {
          console.error(`❌ Error processing message from ${queue}:`, error);
          // Send to DLQ (negative acknowledge with requeue=false)
          this.channel!.nack(msg, false, false);
        }
      }
    });
  }

  /**
   * Assert an exchange
   */
  protected async assertExchange(
    name: string,
    type: "direct" | "topic" | "fanout" | "headers",
    options?: { durable?: boolean }
  ): Promise<void> {
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel not initialized. Call connect() first."
      );
    }
    await this.channel.assertExchange(name, type, {
      durable: options?.durable ?? true,
    });
    console.log(`✅ Exchange asserted: ${name} (${type})`);
  }

  /**
   * Assert a queue
   */
  protected async assertQueue(
    name: string,
    options?: { durable?: boolean }
  ): Promise<void> {
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel not initialized. Call connect() first."
      );
    }
    await this.channel.assertQueue(name, {
      durable: options?.durable ?? true,
    });
    console.log(`✅ Queue asserted: ${name}`);
  }
  /**
   * Bind a queue to an exchange
   */
  protected async bindQueue(
    queue: string,
    exchange: string,
    routingKey: string
  ): Promise<void> {
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel not initialized. Call connect() first."
      );
    }
    await this.channel.bindQueue(queue, exchange, routingKey);
    console.log(`✅ Queue bound: ${queue} -> ${exchange} (${routingKey})`);
  }

  public async close(): Promise<void> {
    if (this.channel) {
      try {
        await this.channel.close();
        console.log("✅ Channel closed");
      } catch (error) {
        console.error("Error closing channel:", error);
      }
    }

    if (this.connection) {
      try {
        await this.connection?.close();
        console.log("✅ RabbitMQ connection closed");
        this.isConnected = false;
      } catch (error) {
        console.error("Error closing connection:", error);
      }
    }
  }

  public isReady(): boolean {
    return this.isConnected && this.channel !== null;
  }

  public getChannel(): Channel {
    if (!this.channel) {
      throw new Error("Channel not available. Call connect() first.");
    }
    return this.channel;
  }
}

export default RabbitMQClient;
