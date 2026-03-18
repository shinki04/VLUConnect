import { getPostCacheService } from "./postCacheService";
import { getFeedCacheService } from "./feedCacheService";

export interface CacheInvalidationEvent {
  type: "post" | "feed" | "user";
  action: "create" | "update" | "delete";
  postId?: string;
  userId?: string;
  timestamp: number;
}

/**
 * CacheInvalidationService - Manages cache invalidation across services
 * 
 * Features:
 * - Coordinated invalidation of posts and feeds
 * - Event publishing for RabbitMQ integration
 * - Batch invalidation support
 */
class CacheInvalidationService {
  private postCache = getPostCacheService();
  private feedCache = getFeedCacheService();

  /**
   * Invalidate a post and related feeds
   */
  async invalidatePostAndFeeds(postId: string, authorId: string): Promise<void> {
    try {
      console.log(`Invalidating post ${postId} and feeds for user ${authorId}`);

      await Promise.all([
        // Invalidate the specific post
        this.postCache.invalidatePost(postId),
        
        // Invalidate author's feed (they might see their own posts)
        this.feedCache.invalidateUserFeed(authorId),
      ]);

      console.log(`Invalidated post ${postId} and related feeds`);
    } catch (error) {
      console.error("Error invalidating post and feeds:", error);
    }
  }

  /**
   * Invalidate multiple posts and their related feeds
   */
  async invalidateMultiplePosts(
    posts: Array<{ postId: string; authorId: string }>
  ): Promise<void> {
    try {
      const postIds = posts.map((p) => p.postId);
      const uniqueUserIds = [...new Set(posts.map((p) => p.authorId))];

      console.log(
        `Batch invalidating ${postIds.length} posts and feeds for ${uniqueUserIds.length} users`
      );

      await Promise.all([
        // Invalidate all posts
        this.postCache.invalidatePosts(postIds),
        
        // Invalidate all affected user feeds
        ...uniqueUserIds.map((userId) => this.feedCache.invalidateUserFeed(userId)),
      ]);

      console.log(`Batch invalidation complete`);
    } catch (error) {
      console.error("Error batch invalidating:", error);
    }
  }

  /**
   * Invalidate user's entire feed
   */
  async invalidateUserFeed(userId: string): Promise<void> {
    try {
      console.log(`Invalidating all feeds for user ${userId}`);
      await this.feedCache.invalidateUserFeed(userId);
      console.log(`Invalidated user ${userId} feeds`);
    } catch (error) {
      console.error(`Error invalidating user feed:`, error);
    }
  }

  /**
   * Handle post creation event
   * Invalidates author's feed so they see their new post
   */
  async onPostCreated(postId: string, authorId: string): Promise<void> {
    console.log(`Post created: ${postId} by ${authorId}`);
    
    // Only invalidate author's feed (new post should appear)
    // Don't invalidate the post itself (it doesn't exist in cache yet)
    await this.feedCache.invalidateUserFeed(authorId);
  }

  /**
   * Handle post update event
   * Invalidates the post cache and author's feed
   */
  async onPostUpdated(postId: string, authorId: string): Promise<void> {
    console.log(` Post updated: ${postId} by ${authorId}`);
    
    await this.invalidatePostAndFeeds(postId, authorId);
  }

  /**
   * Handle post deletion event
   * Invalidates the post cache and author's feed
   */
  async onPostDeleted(postId: string, authorId: string): Promise<void> {
    console.log(`Post deleted: ${postId} by ${authorId}`);
    
    await this.invalidatePostAndFeeds(postId, authorId);
  }

  /**
   * Create invalidation event for publishing to RabbitMQ
   */
  createInvalidationEvent(
    type: "post" | "feed" | "user",
    action: "create" | "update" | "delete",
    data: { postId?: string; userId?: string }
  ): CacheInvalidationEvent {
    return {
      type,
      action,
      postId: data.postId,
      userId: data.userId,
      timestamp: Date.now(),
    };
  }

  /**
   * Handle incoming invalidation event from RabbitMQ
   * Useful for multi-instance cache synchronization
   */
  async handleInvalidationEvent(event: CacheInvalidationEvent): Promise<void> {
    console.log(`Received cache invalidation event:`, event);

    try {
      switch (event.type) {
        case "post":
          if (event.postId && event.userId) {
            if (event.action === "create") {
              await this.onPostCreated(event.postId, event.userId);
            } else if (event.action === "update") {
              await this.onPostUpdated(event.postId, event.userId);
            } else if (event.action === "delete") {
              await this.onPostDeleted(event.postId, event.userId);
            }
          }
          break;

        case "feed":
          if (event.userId) {
            await this.invalidateUserFeed(event.userId);
          }
          break;

        case "user":
          if (event.userId) {
            await this.invalidateUserFeed(event.userId);
          }
          break;

        default:
          console.warn(`Unknown invalidation event type: ${event.type}`);
      }
    } catch (error) {
      console.error("Error handling invalidation event:", error);
    }
  }

  /**
   * Clear all caches (use with caution!)
   */
  async clearAllCaches(): Promise<void> {
    console.warn(` Clearing ALL caches - this is a destructive operation!`);
    
    try {
      await Promise.all([
        this.feedCache.invalidateAllFeeds(),
        // Note: We don't have a clear all posts method to prevent accidents
        // If needed, add it to PostCacheService
      ]);

      console.log(`All caches cleared`);
    } catch (error) {
      console.error("Error clearing all caches:", error);
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  async getCacheStats(): Promise<{
    posts: { totalPosts: number; keys: string[] };
    feeds: { totalFeedPages: number; totalMetadata: number; users: Set<string> };
  }> {
    try {
      const [postStats, feedStats] = await Promise.all([
        this.postCache.getStats(),
        this.feedCache.getStats(),
      ]);

      return {
        posts: postStats,
        feeds: feedStats,
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return {
        posts: { totalPosts: 0, keys: [] },
        feeds: { totalFeedPages: 0, totalMetadata: 0, users: new Set() },
      };
    }
  }
}

// Singleton instance
let cacheInvalidationService: CacheInvalidationService | null = null;

export function getCacheInvalidationService(): CacheInvalidationService {
  if (!cacheInvalidationService) {
    cacheInvalidationService = new CacheInvalidationService();
  }
  return cacheInvalidationService;
}

export default CacheInvalidationService;
