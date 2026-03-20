import { getFeedCacheService } from "@repo/redis/feedCacheService";
import { FeedFilter } from "@repo/shared/types/post";

import { fetchPosts } from "@/app/actions/post";

export async function getFeedPosts(page = 1, limit = 10, userId: string = "public", filter: FeedFilter = "all") {
  const feedCache = getFeedCacheService();
  
  // Try cache first
  const cachedFeed = await feedCache.getCachedFeedPage(userId, page, limit, filter);
  
  if (cachedFeed) {
    return {
       data: cachedFeed.posts,
       metadata: {
           hasMore: cachedFeed.hasMore,
           total: cachedFeed.total,
           page: cachedFeed.page
       },
       cacheStatus: "HIT",
       cacheKey: `feed:${userId}:${filter}:${page}:${limit}`
    };
  }
  
  // Fetch from DB
  const result = await fetchPosts(page, limit, filter);
  
  return {
      data: result.posts,
      metadata: {
          hasMore: result.hasMore,
          total: result.total,
          page: result.currentPage
      },
      cacheStatus: "MISS",
      cacheKey: `feed:${userId}:${filter}:${page}:${limit}`
  };
}
