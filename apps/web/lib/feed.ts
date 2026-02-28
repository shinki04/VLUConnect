import { getFeedCacheService } from "@repo/redis/feedCacheService";

import { fetchPosts } from "@/app/actions/post";

export async function getFeedPosts(page = 1, limit = 10, userId: string = "public") {
  const feedCache = getFeedCacheService();
  
  // Try cache first
  const cachedFeed = await feedCache.getCachedFeedPage(userId, page, limit);
  
  if (cachedFeed) {
    return {
       data: cachedFeed.posts,
       metadata: {
           hasMore: cachedFeed.hasMore,
           total: cachedFeed.total,
           page: cachedFeed.page
       },
       cacheStatus: "HIT",
       cacheKey: `feed:${userId}:${page}:${limit}`
    };
  }
  
  // Fetch from DB
  const result = await fetchPosts(page, limit);
  
  return {
      data: result.posts,
      metadata: {
          hasMore: result.hasMore,
          total: result.total,
          page: result.currentPage
      },
      cacheStatus: "MISS",
      cacheKey: `feed:${userId}:${page}:${limit}`
  };
}
