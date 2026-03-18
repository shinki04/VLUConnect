import { getRedisClient } from "./redis";
import type { Database } from "@repo/shared/types/database.types";

export type SystemAnnouncement = Database["public"]["Tables"]["system_announcements"]["Row"];

const CACHE_KEY_PREFIX = "system_announcements";
const ACTIVE_ANNOUNCEMENTS_KEY = `${CACHE_KEY_PREFIX}:active`;
const DEFAULT_TTL = 60 * 60 * 24; // 24 hours fallback

export class SystemAnnouncementCacheService {
  private redisClient = getRedisClient();

  async getActiveAnnouncements(): Promise<SystemAnnouncement[] | null> {
    try {
      const data = await this.redisClient.getCache<SystemAnnouncement[]>(ACTIVE_ANNOUNCEMENTS_KEY);
      if (data) {
        console.log("Cache HIT for active system announcements");
        return data;
      }
      console.log("Cache MISS for active system announcements");
      return null;
    } catch (error) {
      console.error("Error fetching system announcements from cache:", error);
      return null;
    }
  }

  async setActiveAnnouncements(announcements: SystemAnnouncement[]): Promise<void> {
    try {
      await this.redisClient.setCache(ACTIVE_ANNOUNCEMENTS_KEY, announcements, DEFAULT_TTL);
      console.log(`Cached ${announcements.length} active system announcements`);
    } catch (error) {
      console.error("Error setting system announcements in cache:", error);
    }
  }

  async invalidateActiveAnnouncements(): Promise<void> {
    try {
      await this.redisClient.delCache(ACTIVE_ANNOUNCEMENTS_KEY);
      console.log("Invalidated active system announcements cache");
    } catch (error) {
      console.error("Error invalidating system announcements cache:", error);
    }
  }
}

export const systemAnnouncementCache = new SystemAnnouncementCacheService();
