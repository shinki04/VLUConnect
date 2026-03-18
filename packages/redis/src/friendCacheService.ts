import { Tables } from "@repo/shared/types/database.types";
import { FriendshipResult, FriendshipWithUser } from "@repo/shared/types/friendship";
import { getRedisClient } from "./redis";

/**
 * FriendCacheService - Manages caching for user friendships
 */
export class FriendCacheService {
  private redis = getRedisClient();
  private readonly FRIENDSHIP_STATUS_PREFIX = "friend_status:";
  private readonly FRIENDS_LIST_PREFIX = "friends_list:";
  private readonly PENDING_REQ_PREFIX = "pending_req:";
  private readonly SENT_REQ_PREFIX = "sent_req:";
  private readonly CACHE_TTL = 3600; // 1 hour

  private getStatusKey(userId1: string, userId2: string): string {
    // Sort to ensure the key is the same regardless of order
    const sortedIds = [userId1, userId2].sort();
    return `${this.FRIENDSHIP_STATUS_PREFIX}${sortedIds[0]}:${sortedIds[1]}`;
  }

  private getFriendsListKey(userId: string): string {
    return `${this.FRIENDS_LIST_PREFIX}${userId}`;
  }

  private getPendingReqKey(userId: string): string {
    return `${this.PENDING_REQ_PREFIX}${userId}`;
  }

  private getSentReqKey(userId: string): string {
    return `${this.SENT_REQ_PREFIX}${userId}`;
  }

  // --- Friendship Status ---

  async getFriendshipStatus(
    userId1: string,
    userId2: string
  ): Promise<FriendshipResult | null> {
    try {
      await this.redis.connect();
      const key = this.getStatusKey(userId1, userId2);
      const cached = await this.redis.getCache<FriendshipResult>(key);

      if (cached) {
        console.log(`Cache HIT: ${key}`);
        return cached;
      }
      return null;
    } catch (error) {
      console.error(`Error getting cached friendship status:`, error);
      return null;
    }
  }

  async setFriendshipStatus(
    userId1: string,
    userId2: string,
    status: FriendshipResult,
    ttl: number = this.CACHE_TTL
  ): Promise<void> {
    try {
      await this.redis.connect();
      const key = this.getStatusKey(userId1, userId2);
      await this.redis.setCache(key, status, ttl);
      console.log(` Cached ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error(`Error caching friendship status:`, error);
    }
  }

  // --- Friends List ---

  async getFriends(userId: string): Promise<Tables<"profiles">[] | null> {
    try {
      await this.redis.connect();
      const key = this.getFriendsListKey(userId);
      const cached = await this.redis.getCache<Tables<"profiles">[]>(key);

      if (cached) {
        console.log(`Cache HIT: ${key}`);
        return cached;
      }
      return null;
    } catch (error) {
      console.error(`Error getting cached friends list:`, error);
      return null;
    }
  }

  async setFriends(
    userId: string,
    friends: Tables<"profiles">[],
    ttl: number = this.CACHE_TTL
  ): Promise<void> {
    try {
      await this.redis.connect();
      const key = this.getFriendsListKey(userId);
      await this.redis.setCache(key, friends, ttl);
      console.log(` Cached ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error(`Error caching friends list:`, error);
    }
  }

  // --- Pending Requests ---

  async getPendingRequests(userId: string): Promise<FriendshipWithUser[] | null> {
    try {
      await this.redis.connect();
      const key = this.getPendingReqKey(userId);
      const cached = await this.redis.getCache<FriendshipWithUser[]>(key);
      if (cached) return cached;
      return null;
    } catch (error) {
      console.error(`Error getting pending requests:`, error);
      return null;
    }
  }

  async setPendingRequests(
    userId: string,
    requests: FriendshipWithUser[],
    ttl: number = this.CACHE_TTL
  ): Promise<void> {
    try {
      await this.redis.connect();
      const key = this.getPendingReqKey(userId);
      await this.redis.setCache(key, requests, ttl);
    } catch (error) {
      console.error(`Error caching pending requests:`, error);
    }
  }

  // --- Sent Requests ---

  async getSentRequests(userId: string): Promise<FriendshipWithUser[] | null> {
    try {
      await this.redis.connect();
      const key = this.getSentReqKey(userId);
      const cached = await this.redis.getCache<FriendshipWithUser[]>(key);
      if (cached) return cached;
      return null;
    } catch (error) {
      console.error(`Error getting sent requests:`, error);
      return null;
    }
  }

  async setSentRequests(
    userId: string,
    requests: FriendshipWithUser[],
    ttl: number = this.CACHE_TTL
  ): Promise<void> {
    try {
      await this.redis.connect();
      const key = this.getSentReqKey(userId);
      await this.redis.setCache(key, requests, ttl);
    } catch (error) {
      console.error(`Error caching sent requests:`, error);
    }
  }

  // --- Invalidation ---

  async invalidateFriendship(userId1: string, userId2: string): Promise<void> {
    try {
      await this.redis.connect();
      const pipeline = this.redis.getClient().pipeline();

      // Invalidate specific friendship status
      pipeline.del(this.getStatusKey(userId1, userId2));

      // Invalidate friends list for both
      pipeline.del(this.getFriendsListKey(userId1));
      pipeline.del(this.getFriendsListKey(userId2));

      // Invalidate pending/sent requests for both
      pipeline.del(this.getPendingReqKey(userId1));
      pipeline.del(this.getPendingReqKey(userId2));
      pipeline.del(this.getSentReqKey(userId1));
      pipeline.del(this.getSentReqKey(userId2));

      await pipeline.exec();
      console.log(`Invalidated friendship cache for ${userId1} and ${userId2}`);
    } catch (error) {
      console.error(`Error invalidating friendship cache:`, error);
    }
  }
}

// Singleton instance
let friendCacheService: FriendCacheService | null = null;
export function getFriendCacheService(): FriendCacheService {
  if (!friendCacheService) {
    friendCacheService = new FriendCacheService();
  }
  return friendCacheService;
}
export default FriendCacheService;
