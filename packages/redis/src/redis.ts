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
  private connectPromise: Promise<void> | null = null;

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
      console.log("Connected to Redis", redisUrl);
      this.isConnected = true;
    });

    this.redis.on("error", (err) => {
      console.error("Redis connection error:", err);
      this.isConnected = false;
      this.connectPromise = null;
    });

    this.redis.on("close", () => {
      console.log(" Redis connection closed");
      this.isConnected = false;
      this.connectPromise = null;
    });
  }

  async connect(): Promise<void> {
    const status = this.redis.status;
    // Already connected or ready — nothing to do
    if (status === "ready" || status === "connect") {
      return;
    }
    // A connection attempt is already in flight — wait for it
    if (this.connectPromise) {
      return this.connectPromise;
    }
    // Only call connect() when the client is in a connectable state
    if (status === "wait" || status === "end" || status === "close") {
      this.connectPromise = this.redis.connect().then(() => {
        this.connectPromise = null;
      }).catch((err) => {
        this.connectPromise = null;
        throw err;
      });
      return this.connectPromise;
    }
    // status === "connecting" or "reconnecting" — wait until ready
    return new Promise<void>((resolve, reject) => {
      const onReady = () => { cleanup(); resolve(); };
      const onError = (err: Error) => { cleanup(); reject(err); };
      const cleanup = () => {
        this.redis.removeListener("ready", onReady);
        this.redis.removeListener("error", onError);
      };
      this.redis.once("ready", onReady);
      this.redis.once("error", onError);
    });
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

    console.log(` Set cache '${key}' in ${Date.now() - start}ms`);
  }

  async getCache<T>(key: string): Promise<T | null> {
    const start = Date.now();

    const data = await this.redis.get(key);
    console.log(` Get cache '${key}' in ${Date.now() - start}ms`);

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
    console.log("Redis cache cleared");
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

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.redis.expire(key, seconds);
    return result === 1;
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    
    const start = Date.now();
    const values = await this.redis.mget(...keys);
    console.log(` Multi-get ${keys.length} keys in ${Date.now() - start}ms`);

    return values.map((data) => {
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as T;
      }
    });
  }

  async mset(keyValuePairs: Record<string, string | number | object>): Promise<void> {
    const start = Date.now();
    const pairs: string[] = [];

    for (const [key, value] of Object.entries(keyValuePairs)) {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      pairs.push(key, data);
    }

    if (pairs.length > 0) {
      await this.redis.mset(...pairs);
      console.log(` Multi-set ${Object.keys(keyValuePairs).length} keys in ${Date.now() - start}ms`);
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    const start = Date.now();
    const keys = await this.redis.keys(pattern);
    
    if (keys.length === 0) {
      console.log(`No keys found for pattern '${pattern}'`);
      return 0;
    }

    const result = await this.redis.del(...keys);
    console.log(`Deleted ${result} keys matching '${pattern}' in ${Date.now() - start}ms`);
    return result;
  }

  async getWithTTL<T>(key: string): Promise<{ value: T | null; ttl: number }> {
    const [value, ttl] = await Promise.all([
      this.getCache<T>(key),
      this.ttl(key),
    ]);

    return { value, ttl };
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
