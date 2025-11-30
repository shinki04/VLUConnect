import Redis, { Redis as RedisInstance } from "ioredis";

interface RedisConfig {
  url?: string;
  enableOfflineQueue?: boolean;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number | null;
}

class RedisClient {
  private redis: RedisInstance;
  private isConnected: boolean = false;

  constructor(config: RedisConfig = {}) {
    const redisUrl =
      config.url || process.env.REDIS_URL || "redis://localhost:6379";

    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: config.enableOfflineQueue !== false,
      enableReadyCheck: config.enableReadyCheck !== false,
      maxRetriesPerRequest: config.maxRetriesPerRequest ?? null,
    });

    // Connection event handlers
    this.redis.on("connect", () => {
      console.log("✅ Connected to Redis", redisUrl);
      this.isConnected = true;
    });

    this.redis.on("error", (err) => {
      console.error("❌ Redis connection error:", err);
      this.isConnected = false;
    });

    this.redis.on("close", () => {
      console.log("⚠️  Redis connection closed");
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.redis.connect();
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  async setCache(
    key: string,
    value: string | number | object,
    expire?: number
  ): Promise<void> {
    const start = Date.now();
    const data = typeof value === "string" ? value : JSON.stringify(value);

    if (expire) {
      await this.redis.set(key, data, "EX", expire);
    } else {
      await this.redis.set(key, data);
    }

    console.log(`⏱️  Set cache '${key}' in ${Date.now() - start}ms`);
  }

  async getCache<T>(key: string): Promise<T | null> {
    const start = Date.now();

    const data = await this.redis.get(key);
    console.log(`⏱️  Get cache '${key}' in ${Date.now() - start}ms`);

    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as T;
    }
  }

  async delCache(key: string): Promise<number> {
    return await this.redis.del(key);
  }

  async flushAll(): Promise<void> {
    await this.redis.flushall();
    console.log("🗑️  Redis cache cleared");
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }

  isReady(): boolean {
    return this.isConnected && this.redis.status === "ready";
  }

  getClient(): RedisInstance {
    return this.redis;
  }
}

// Singleton instance
let redisClient: RedisClient | null = null;

export function getRedisClient(): RedisClient {
  if (!redisClient) {
    redisClient = new RedisClient();
  }
  return redisClient;
}

export function setRedisClient(client: RedisClient): void {
  redisClient = client;
}

export default RedisClient;
