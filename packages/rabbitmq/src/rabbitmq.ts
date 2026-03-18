import amqplib, { Channel, ChannelModel, Message } from "amqplib";

interface QueueConfig {
  name: string;
  durable?: boolean;
  dlq?: string;
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
  publisherPrefetch: number;
  consumerPrefetch: number;
  exchanges: ExchangeConfig[];
  queues: QueueConfig[];
  bindings: BindingConfig[];
}

class RabbitMQClient {
  private connection: ChannelModel | null = null;
  private publisherChannel: Channel | null = null;
  private consumerChannels: Map<string, Channel> = new Map();
  private isConnected: boolean = false;
  private config: RabbitMQConfig;

  constructor(config: RabbitMQConfig) {
    this.config = {
      url:
        config.url ||
        process.env.RABBITMQ_URL ||
        "amqp://guest:guest@localhost:5672",
      publisherPrefetch: config.publisherPrefetch || 20,
      consumerPrefetch: config.consumerPrefetch || 1,
      exchanges: config.exchanges || [],
      queues: config.queues || [],
      bindings: config.bindings || [],
    };
  }

  /**
   * Establish connection and setup all channels
   */
  async connect(): Promise<void> {
    try {
      console.log("Connecting to RabbitMQ...");

      this.connection = await amqplib.connect(this.config.url!);
      console.log("RabbitMQ connected");

      // Setup publisher channel
      await this.setupPublisherChannel();

      // Setup infrastructure (exchanges, queues, bindings)
      await this.setupInfrastructure();

      this.isConnected = true;

      this.setupEventHandlers();
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  /**
   * Setup dedicated publisher channel
   */
  private async setupPublisherChannel(): Promise<void> {
    this.publisherChannel = await this.connection!.createChannel();
    await this.publisherChannel.prefetch(this.config.publisherPrefetch!);
    console.log("Publisher channel ready");
  }

  /**
   * Setup RabbitMQ infrastructure (exchanges, queues, bindings)
   */
  private async setupInfrastructure(): Promise<void> {
    if (!this.publisherChannel) {
      throw new Error("Publisher channel not initialized");
    }

    // Setup exchanges
    for (const exchange of this.config.exchanges!) {
      await this.publisherChannel.assertExchange(exchange.name, exchange.type, {
        durable: exchange.durable ?? true,
      });
      console.log(`Exchange asserted: ${exchange.name} (${exchange.type})`);
    }

    // Setup queues
    for (const queue of this.config.queues!) {
      await this.publisherChannel.assertQueue(queue.name, {
        durable: queue.durable ?? true,
      });
      console.log(`Queue asserted: ${queue.name}`);

      // Setup DLQ if specified
      if (queue.dlq) {
        await this.publisherChannel.assertQueue(queue.dlq, {
          durable: true,
        });
        console.log(`DLQ asserted: ${queue.dlq}`);
      }
    }

    // Setup bindings
    for (const binding of this.config.bindings!) {
      await this.publisherChannel.bindQueue(
        binding.queue,
        binding.exchange,
        binding.routingKey
      );
      console.log(
        `Binding: ${binding.queue} -> ${binding.exchange} (${binding.routingKey})`
      );
    }
  }

  /**
   * Get or create consumer channel for a specific queue
   */
  private async getConsumerChannel(queue: string): Promise<Channel> {
    if (this.consumerChannels.has(queue)) {
      const existingChannel = this.consumerChannels.get(queue)!;
      // Check if channel is still open
      try {
        // Try to check queue - this will throw if channel is closed
        await existingChannel.checkQueue(queue);
        return existingChannel;
      } catch (error) {
        console.log(`Consumer channel for ${queue} is stale, creating new one`);
        this.consumerChannels.delete(queue);
      }
    }

    const consumerChannel = await this.connection!.createChannel();
    
    // Add event handlers for debugging
    consumerChannel.on('error', (err) => {
      console.error(`Consumer channel error for ${queue}:`, err);
    });
    
    consumerChannel.on('close', () => {
      console.log(`Consumer channel for ${queue} closed`);
      this.consumerChannels.delete(queue);
    });

    this.consumerChannels.set(queue, consumerChannel);

    console.log(`Consumer channel created for queue: ${queue}`);
    return consumerChannel;
  }

  /**
   * Setup event handlers for connection and channels
   */
  private setupEventHandlers(): void {
    this.connection!.on("close", () => {
      console.log("RabbitMQ connection closed");
      this.isConnected = false;
      this.reconnect();
    });

    this.connection!.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
      this.isConnected = false;
    });

    this.publisherChannel!.on("error", (err) => {
      console.error("Publisher channel error:", err);
    });

    this.publisherChannel!.on("close", () => {
      console.log("Publisher channel closed");
    });
  }

  /**
   * Reconnect logic with exponential backoff
   */
  private async reconnect(attempt: number = 1): Promise<void> {
    const maxAttempts = 5;
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);

    console.log(`Reconnection attempt ${attempt} in ${delay}ms...`);

    if (attempt > maxAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, delay));
      await this.connect();
      console.log("Reconnected successfully");
    } catch (error) {
      console.error(`Reconnection attempt ${attempt} failed:`, error);
      await this.reconnect(attempt + 1);
    }
  }

  // ========== PUBLIC METHODS ==========

  /**
   * Publish message directly to a queue
   */
  public async publishToQueue(
    queue: string,
    payload: Record<string, unknown>,
    options?: {
      persistent?: boolean;
      contentType?: string;
      headers?: Record<string, unknown>;
    }
  ): Promise<boolean> {
    if (!this.publisherChannel) {
      throw new Error(
        "Publisher channel not initialized. Call connect() first."
      );
    }

    const message = JSON.stringify(payload);
    const published = this.publisherChannel.sendToQueue(
      queue,
      Buffer.from(message),
      {
        persistent: options?.persistent ?? true,
        contentType: options?.contentType ?? "application/json",
        headers: options?.headers,
      }
    );

    if (published) {
      console.log(`📤 Message published to queue: ${queue}`);
    } else {
      console.error(`Failed to publish message to queue: ${queue}`);
    }

    return published;
  }

  /**
   * Publish message to an exchange with routing key
   */
  public async publishToExchange<T>(
    exchange: string,
    routingKey: string,
    payload: T,
    options?: {
      persistent?: boolean;
      contentType?: string;
      headers?: Record<string, unknown>;
    }
  ): Promise<boolean> {
    if (!this.publisherChannel) {
      throw new Error(
        "Publisher channel not initialized. Call connect() first."
      );
    }

    const message = Buffer.from(JSON.stringify(payload));
    const published = this.publisherChannel.publish(
      exchange,
      routingKey,
      Buffer.from(message),
      {
        persistent: options?.persistent ?? true,
        contentType: options?.contentType ?? "application/json",
        headers: options?.headers,
      }
    );

    if (published) {
      console.log(
        `📤 Message published to exchange: ${exchange} (${routingKey})`
      );
    } else {
      console.error(`Failed to publish message to exchange: ${exchange}`);
    }

    return published;
  }

  /**
   * Consume messages from a queue with dedicated consumer channel
   */
  public async consumeQueue<T>(
    queue: string,
    callback: (payload: T, msg: Message) => Promise<void>,
    options?: {
      sendToDLQ?: boolean;
      dlqName?: string;
      prefetch?: number;
    }
  ): Promise<void> {
    const consumerChannel = await this.getConsumerChannel(queue);

    const prefetchValue = options?.prefetch ?? this.config.consumerPrefetch;
    await consumerChannel.prefetch(prefetchValue!);

    await consumerChannel.consume(queue, async (msg: Message | null) => {
      if (!msg) {
        console.warn(`Received null message from queue: ${queue}`);
        return;
      }

      try {
        const payload = JSON.parse(msg.content.toString()) as T;
        console.log(`Processing message from queue: ${queue}`);

        await callback(payload, msg);

        consumerChannel.ack(msg);
        console.log(`Message processed successfully: ${queue}`);
      } catch (error) {
        console.error(`Error processing message from ${queue}:`, error);

        if (options?.sendToDLQ && options.dlqName) {
          await this.sendToDLQ(options.dlqName, msg.content, consumerChannel);
          consumerChannel.ack(msg);
          console.log(`Message moved to DLQ: ${options.dlqName}`);
        } else {
          consumerChannel.nack(msg, false, false);
          console.log(`Message rejected from: ${queue}`);
        }
      }
    });

    console.log(`Started consuming queue: ${queue}`);
  }

  /**
   * Send message to Dead Letter Queue
   */
  private async sendToDLQ(
    dlqName: string,
    content: Buffer,
    consumerChannel: Channel
  ): Promise<void> {
    consumerChannel.sendToQueue(dlqName, content, {
      persistent: true,
      headers: {
        "x-death-reason": "processing_failed",
        "x-original-timestamp": new Date().toISOString(),
      },
    });
  }

  /**
   * Close all channels and connection
   */
  public async close(): Promise<void> {
    console.log("Closing RabbitMQ connection...");

    // Close all consumer channels
    for (const [queue, channel] of this.consumerChannels) {
      try {
        await channel.close();
        console.log(`Closed consumer channel for: ${queue}`);
      } catch (error) {
        console.error(`Error closing consumer channel for ${queue}:`, error);
      }
    }
    this.consumerChannels.clear();

    // Close publisher channel
    if (this.publisherChannel) {
      try {
        await this.publisherChannel.close();
        console.log("Publisher channel closed");
      } catch (error) {
        console.error("Error closing publisher channel:", error);
      }
      this.publisherChannel = null;
    }

    // Close connection
    if (this.connection) {
      try {
        await this.connection.close();
        console.log("RabbitMQ connection closed");
      } catch (error) {
        console.error("Error closing connection:", error);
      }
      this.connection = null;
    }

    this.isConnected = false;
  }

  // ========== UTILITY METHODS ==========

  public isReady(): boolean {
    return this.isConnected && this.publisherChannel !== null;
  }

  public getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      publisherReady: !!this.publisherChannel,
      consumerChannels: Array.from(this.consumerChannels.keys()),
    };
  }
}

export default RabbitMQClient;
