import { getRedisClient } from "./redis";
import { CachedPost } from "./postCacheService";

export interface FeedPage {
  posts: CachedPost[];
  page: number;
  hasMore: boolean;
  total: number;
  itemsPerPage: number;
}

export interface FeedMetadata {
  postIds: string[];
  total: number;
  lastUpdated: number;
}

/**
 * FeedCacheService - Manages user feed caching with pagination support
 * 
 * Features:
 * - User feed with pagination (5 minutes TTL)
 * - Feed metadata caching (list of post IDs)
 * - Automatic invalidation by user
 * - Pattern-based cache clearing
 */
class FeedCacheService {
  private redis = getRedisClient();
  private readonly FEED_PREFIX = "feed:";
  private readonly FEED_PAGE_PREFIX = "feed:page:";
  private readonly FEED_META_PREFIX = "feed:meta:";
  private readonly FEED_TTL = 300; // 5 minutes
  private readonly META_TTL = 600; // 10 minutes

  /**
   * Generate cache key for user feed page
   */
  private getFeedPageKey(userId: string, page: number, itemsPerPage: number, filter: string = "all"): string {
    return `${this.FEED_PAGE_PREFIX}${userId}:${filter}:${page}:${itemsPerPage}`;
  }

  /**
   * Generate cache key for feed metadata
   */
  private getFeedMetaKey(userId: string): string {
    return `${this.FEED_META_PREFIX}${userId}`;
  }

  /**
   * Get cached feed page
   */
  async getCachedFeedPage(
    userId: string,
    page: number,
    itemsPerPage: number,
    filter: string = "all"
  ): Promise<FeedPage | null> {
    try {
      await this.redis.connect();
      const key = this.getFeedPageKey(userId, page, itemsPerPage, filter);
      const cached = await this.redis.getCache<FeedPage>(key);

      if (cached) {
        console.log(`Cache HIT: feed page ${page} for user ${userId} and filter ${filter}`);
        return cached;
      }

      console.log(`Cache MISS: feed page ${page} for user ${userId} and filter ${filter}`);
      return null;
    } catch (error) {
      console.error(`Error getting cached feed page:`, error);
      return null;
    }
  }

  /**
   * Cache a feed page
   */
  async setCachedFeedPage(
    userId: string,
    page: number,
    itemsPerPage: number,
    filter: string = "all",
    feedPage: FeedPage,
    ttl: number = this.FEED_TTL
  ): Promise<void> {
    try {
      await this.redis.connect();
      const key = this.getFeedPageKey(userId, page, itemsPerPage, filter);
      await this.redis.setCache(key, feedPage, ttl);
      console.log(` Cached feed page ${page} for user ${userId} and filter ${filter} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error(`Error caching feed page:`, error);
    }
  }

  /**
   * Get feed metadata (list of post IDs for the user)
   */
  async getFeedMetadata(userId: string): Promise<FeedMetadata | null> {
    try {
      await this.redis.connect();
      const key = this.getFeedMetaKey(userId);
      const cached = await this.redis.getCache<FeedMetadata>(key);

      if (cached) {
        console.log(`Cache HIT: feed metadata for user ${userId}`);
        return cached;
      }

      console.log(`Cache MISS: feed metadata for user ${userId}`);
      return null;
    } catch (error) {
      console.error(`Error getting feed metadata:`, error);
      return null;
    }
  }

  /**
   * Set feed metadata
   */
  async setFeedMetadata(
    userId: string,
    metadata: FeedMetadata,
    ttl: number = this.META_TTL
  ): Promise<void> {
    try {
      await this.redis.connect();
      const key = this.getFeedMetaKey(userId);
      await this.redis.setCache(key, metadata, ttl);
      console.log(` Cached feed metadata for user ${userId} (${metadata.postIds.length} posts)`);
    } catch (error) {
      console.error(`Error caching feed metadata:`, error);
    }
  }

  /**
   * Invalidate all feed pages for a user
   */
  async invalidateUserFeed(userId: string): Promise<void> {
    try {
      await this.redis.connect();
      
      // Delete all feed pages for this user
      const pattern = `${this.FEED_PAGE_PREFIX}${userId}:*`;
      const deletedPages = await this.redis.deletePattern(pattern);
      
      // Delete feed metadata
      const metaKey = this.getFeedMetaKey(userId);
      await this.redis.delCache(metaKey);

      console.log(`Invalidated user ${userId} feed (${deletedPages} pages + metadata)`);
    } catch (error) {
      console.error(`Error invalidating user feed:`, error);
    }
  }

  /**
   * Invalidate specific feed page
   */
  async invalidateFeedPage(
    userId: string,
    page: number,
    itemsPerPage: number,
    filter: string = "all"
  ): Promise<void> {
    try {
      await this.redis.connect();
      const key = this.getFeedPageKey(userId, page, itemsPerPage, filter);
      await this.redis.delCache(key);
      console.log(`Invalidated feed page ${page} for user ${userId} with filter ${filter}`);
    } catch (error) {
      console.error(`Error invalidating feed page:`, error);
    }
  }

  /**
   * Invalidate all feeds (global clear)
   * Use with caution - this clears all user feeds
   */
  async invalidateAllFeeds(): Promise<void> {
    try {
      await this.redis.connect();
      
      const pagesPattern = `${this.FEED_PAGE_PREFIX}*`;
      const metaPattern = `${this.FEED_META_PREFIX}*`;
      
      const [deletedPages, deletedMeta] = await Promise.all([
        this.redis.deletePattern(pagesPattern),
        this.redis.deletePattern(metaPattern),
      ]);

      console.log(
        `Invalidated ALL feeds (${deletedPages} pages + ${deletedMeta} metadata)`
      );
    } catch (error) {
      console.error(`Error invalidating all feeds:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalFeedPages: number;
    totalMetadata: number;
    users: Set<string>;
  }> {
    try {
      await this.redis.connect();
      
      const [pageKeys, metaKeys] = await Promise.all([
        this.redis.keys(`${this.FEED_PAGE_PREFIX}*`),
        this.redis.keys(`${this.FEED_META_PREFIX}*`),
      ]);

      // Extract unique user IDs from keys
      const users = new Set<string>();
      pageKeys.forEach((key) => {
        const userId = key.split(":")[2]; // feed:page:{userId}:...
        if (userId) users.add(userId);
      });

      return {
        totalFeedPages: pageKeys.length,
        totalMetadata: metaKeys.length,
        users,
      };
    } catch (error) {
      console.error("Error getting feed cache stats:", error);
      return { totalFeedPages: 0, totalMetadata: 0, users: new Set() };
    }
  }

  /**
   * Warm cache for a user (pre-populate first page)
   * Useful for active users or after creating new content
   */
  async warmUserFeedCache(
    userId: string,
    fetchFn: (page: number, itemsPerPage: number) => Promise<FeedPage>
  ): Promise<void> {
    try {
      console.log(`🔥 Warming cache for user ${userId}`);
      const firstPage = await fetchFn(1, 10);
      await this.setCachedFeedPage(userId, 1, 10, "all", firstPage);
      
      // Also cache metadata if we have post IDs
      if (firstPage.posts.length > 0) {
        const metadata: FeedMetadata = {
          postIds: firstPage.posts.map((p) => p.id),
          total: firstPage.total,
          lastUpdated: Date.now(),
        };
        await this.setFeedMetadata(userId, metadata);
      }
    } catch (error) {
      console.error(`Error warming cache for user ${userId}:`, error);
    }
  }

  /**
   * Check if feed cache exists for user
   */
  async hasCachedFeed(userId: string): Promise<boolean> {
    try {
      await this.redis.connect();
      const metaKey = this.getFeedMetaKey(userId);
      return await this.redis.exists(metaKey);
    } catch (error) {
      console.error("Error checking feed cache:", error);
      return false;
    }
  }

  /**
   * Get TTL for feed metadata
   */
  async getFeedTTL(userId: string): Promise<number> {
    try {
      await this.redis.connect();
      const metaKey = this.getFeedMetaKey(userId);
      return await this.redis.ttl(metaKey);
    } catch (error) {
      console.error("Error getting feed TTL:", error);
      return -1;
    }
  }
}

// Singleton instance
let feedCacheService: FeedCacheService | null = null;

export function getFeedCacheService(): FeedCacheService {
  if (!feedCacheService) {
    feedCacheService = new FeedCacheService();
  }
  return feedCacheService;
}

export default FeedCacheService;
