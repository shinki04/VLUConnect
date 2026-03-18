import { Tables } from "@repo/shared/types/database.types";
import { ConversationWithDetails, MessageWithSender } from "@repo/shared/types/messaging";
import { getRedisClient } from "./redis";

/**
 * MessageCacheService - Manages caching for conversations and messages
 */
export class MessageCacheService {
  private redis = getRedisClient();
  private readonly CONVERSATIONS_PREFIX = "conversations:";
  private readonly UNREAD_MAP_PREFIX = "unread_map:";
  private readonly MSG_PREFIX = "msgs:";
  private readonly CACHE_TTL = 3600; // 1 hour

  private getConversationsKey(userId: string): string {
    return `${this.CONVERSATIONS_PREFIX}${userId}`;
  }

  private getMessagesKey(conversationId: string): string {
    return `${this.MSG_PREFIX}${conversationId}`;
  }

  // --- Conversations ---

  async getConversations(userId: string): Promise<ConversationWithDetails[] | null> {
    try {
      await this.redis.connect();
      const key = this.getConversationsKey(userId);
      const cached = await this.redis.getCache<ConversationWithDetails[]>(key);

      if (cached) {
        console.log(`Cache HIT: ${key}`);
        return cached;
      }
      return null;
    } catch (error) {
      console.error(`Error getting cached conversations:`, error);
      return null;
    }
  }

  async setConversations(
    userId: string,
    conversations: ConversationWithDetails[],
    ttl: number = this.CACHE_TTL
  ): Promise<void> {
    try {
      await this.redis.connect();
      const key = this.getConversationsKey(userId);
      await this.redis.setCache(key, conversations, ttl);
      console.log(` Cached ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error(`Error caching conversations:`, error);
    }
  }

  async invalidateConversations(userId: string): Promise<void> {
    try {
      await this.redis.connect();
      await this.redis.delCache(this.getConversationsKey(userId));
    } catch (error) {
      console.error(`Error invalidating conversations:`, error);
    }
  }

  async invalidateConversationsForMembers(memberIds: string[]): Promise<void> {
    try {
      await this.redis.connect();
      const pipeline = this.redis.getClient().pipeline();
      memberIds.forEach((id) => pipeline.del(this.getConversationsKey(id)));
      await pipeline.exec();
    } catch (error) {
      console.error(`Error invalidating conversations for members:`, error);
    }
  }

  // --- Messages ---

  async getMessages(conversationId: string): Promise<MessageWithSender[] | null> {
    try {
      await this.redis.connect();
      const key = this.getMessagesKey(conversationId);
      const cached = await this.redis.getCache<MessageWithSender[]>(key);

      if (cached) {
        return cached;
      }
      return null;
    } catch (error) {
      console.error(`Error getting cached messages:`, error);
      return null;
    }
  }

  async setMessages(
    conversationId: string,
    messages: MessageWithSender[],
    ttl: number = this.CACHE_TTL
  ): Promise<void> {
    try {
      await this.redis.connect();
      const key = this.getMessagesKey(conversationId);
      await this.redis.setCache(key, messages, ttl);
    } catch (error) {
      console.error(`Error caching messages:`, error);
    }
  }

  async invalidateMessages(conversationId: string): Promise<void> {
    try {
      await this.redis.connect();
      await this.redis.delCache(this.getMessagesKey(conversationId));
    } catch (error) {
      console.error(`Error invalidating messages:`, error);
    }
  }
}

// Singleton instance
let messageCacheService: MessageCacheService | null = null;
export function getMessageCacheService(): MessageCacheService {
  if (!messageCacheService) {
    messageCacheService = new MessageCacheService();
  }
  return messageCacheService;
}
export default MessageCacheService;
