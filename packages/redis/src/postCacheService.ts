import { getRedisClient } from "./redis";
import { PostResponse } from "@repo/shared/types/post";

export type CachedPost = PostResponse;

/**
 * PostCacheService - Manages individual post caching with stampede protection
 * 
 * Features:
 * - Single post caching with 1 hour TTL
 * - Batch get/set operations for multiple posts
 * - Cache stampede protection using locks
 * - Automatic cache invalidation
 */
class PostCacheService {
  private redis = getRedisClient();
  private readonly POST_PREFIX = "post:";
  private readonly LOCK_PREFIX = "lock:post:";
  private readonly POST_TTL = 3600; // 1 hour
  private readonly LOCK_TTL = 10; // 10 seconds for lock

  /**
   * Generate cache key for a post
   */
  private getPostKey(postId: string): string {
    return `${this.POST_PREFIX}${postId}`;
  }

  /**
   * Generate lock key for stampede protection
   */
  private getLockKey(postId: string): string {
    return `${this.LOCK_PREFIX}${postId}`;
  }

  /**
   * Acquire lock for cache stampede protection
   * Returns true if lock acquired, false otherwise
   */
  private async acquireLock(postId: string): Promise<boolean> {
    try {
      const lockKey = this.getLockKey(postId);
      const result = await this.redis.getClient().set(
        lockKey,
        "1",
        "EX",
        this.LOCK_TTL,
        "NX" // Only set if not exists
      );
      return result === "OK";
    } catch (error) {
      console.error(`Failed to acquire lock for post ${postId}:`, error);
      return false;
    }
  }

  /**
   * Release lock
   */
  private async releaseLock(postId: string): Promise<void> {
    try {
      const lockKey = this.getLockKey(postId);
      await this.redis.delCache(lockKey);
    } catch (error) {
      console.error(`Failed to release lock for post ${postId}:`, error);
    }
  }

  /**
   * Wait for lock to be released (with timeout)
   */
  private async waitForLock(postId: string, timeoutMs = 5000): Promise<void> {
    const lockKey = this.getLockKey(postId);
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const exists = await this.redis.exists(lockKey);
      if (!exists) {
        return;
      }
      // Wait 50ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.warn(`Lock wait timeout for post ${postId}`);
  }

  /**
   * Get cached post by ID with stampede protection
   */
  async getCachedPost(postId: string): Promise<CachedPost | null> {
    try {
      await this.redis.connect();
      const key = this.getPostKey(postId);
      
      // Check if lock exists (someone is fetching)
      const lockExists = await this.redis.exists(this.getLockKey(postId));
      if (lockExists) {
        // Wait for the other request to populate cache
        await this.waitForLock(postId);
      }

      const cached = await this.redis.getCache<CachedPost>(key);
      if (cached) {
        console.log(`Cache HIT: post:${postId}`);
        return cached;
      }

      console.log(`Cache MISS: post:${postId}`);
      return null;
    } catch (error) {
      console.error(`Error getting cached post ${postId}:`, error);
      return null;
    }
  }

  /**
   * Set post in cache
   */
  async setCachedPost(
    postId: string,
    post: CachedPost,
    ttl: number = this.POST_TTL
  ): Promise<void> {
    try {
      await this.redis.connect();
      const key = this.getPostKey(postId);
      await this.redis.setCache(key, post, ttl);
      console.log(` Cached post:${postId} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error(`Error caching post ${postId}:`, error);
    }
  }

  /**
   * Get or fetch post with stampede protection
   * Usage: await getCachedOrFetch(postId, async () => fetchFromDB(postId))
   */
  async getCachedOrFetch(
    postId: string,
    fetchFn: () => Promise<CachedPost | null>
  ): Promise<CachedPost | null> {
    // Try cache first
    const cached = await this.getCachedPost(postId);
    if (cached) return cached;

    // Try to acquire lock
    const lockAcquired = await this.acquireLock(postId);
    
    if (!lockAcquired) {
      // Another process is fetching, wait and try cache again
      await this.waitForLock(postId);
      return await this.getCachedPost(postId);
    }

    try {
      // Fetch from source
      console.log(`Fetching post:${postId} from source`);
      const post = await fetchFn();
      
      if (post) {
        // Cache the result
        await this.setCachedPost(postId, post);
      }
      
      return post;
    } finally {
      // Always release lock
      await this.releaseLock(postId);
    }
  }

  /**
   * Batch get multiple posts
   */
  async getCachedPosts(postIds: string[]): Promise<Map<string, CachedPost>> {
    try {
      await this.redis.connect();
      const keys = postIds.map((id) => this.getPostKey(id));
      const results = await this.redis.mget<CachedPost>(keys);

      const postsMap = new Map<string, CachedPost>();
      results.forEach((post, index) => {
        if (post && postIds[index]) {
          postsMap.set(postIds[index]!, post);
        }
      });

      console.log(`Batch get: ${postsMap.size}/${postIds.length} posts from cache`);
      return postsMap;
    } catch (error) {
      console.error("Error batch getting posts:", error);
      return new Map();
    }
  }

  /**
   * Batch set multiple posts
   */
  async setCachedPosts(
    posts: CachedPost[],
    ttl: number = this.POST_TTL
  ): Promise<void> {
    try {
      await this.redis.connect();
      const keyValuePairs: Record<string, CachedPost> = {};

      posts.forEach((post) => {
        const key = this.getPostKey(post.id);
        keyValuePairs[key] = post;
      });

      await this.redis.mset(keyValuePairs);

      // Set TTL for each key (mset doesn't support TTL)
      const pipeline = this.redis.getClient().pipeline();
      Object.keys(keyValuePairs).forEach((key) => {
        pipeline.expire(key, ttl);
      });
      await pipeline.exec();

      console.log(` Batch cached ${posts.length} posts (TTL: ${ttl}s)`);
    } catch (error) {
      console.error("Error batch caching posts:", error);
    }
  }

  /**
   * Invalidate (delete) a post from cache
   */
  async invalidatePost(postId: string): Promise<void> {
    try {
      await this.redis.connect();
      const key = this.getPostKey(postId);
      await this.redis.delCache(key);
      console.log(`Invalidated cache: post:${postId}`);
    } catch (error) {
      console.error(`Error invalidating post ${postId}:`, error);
    }
  }

  /**
   * Invalidate multiple posts
   */
  async invalidatePosts(postIds: string[]): Promise<void> {
    try {
      await this.redis.connect();
      const keys = postIds.map((id) => this.getPostKey(id));
      const pipeline = this.redis.getClient().pipeline();
      
      keys.forEach((key) => pipeline.del(key));
      await pipeline.exec();

      console.log(`Invalidated ${postIds.length} posts from cache`);
    } catch (error) {
      console.error("Error invalidating posts:", error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalPosts: number;
    keys: string[];
  }> {
    try {
      await this.redis.connect();
      const keys = await this.redis.keys(`${this.POST_PREFIX}*`);
      return {
        totalPosts: keys.length,
        keys,
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return { totalPosts: 0, keys: [] };
    }
  }
}

// Singleton instance
let postCacheService: PostCacheService | null = null;

export function getPostCacheService(): PostCacheService {
  if (!postCacheService) {
    postCacheService = new PostCacheService();
  }
  return postCacheService;
}

export default PostCacheService;
