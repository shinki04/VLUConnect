"use client";

import { Post } from "@repo/shared/types/post";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useGetCurrentUser } from "./useAuth";

const ITEMS_PER_PAGE = 10;

export interface PostsPage {
  posts: Post[];
  page: number;
  hasMore: boolean;
}

export function useInfinitePostsQuery() {
  const user = useGetCurrentUser();
  return useInfiniteQuery({
    queryKey: ["posts", "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      if (!user.data) {
        throw new Error("Something went wrong!");
      }

      const res = await fetch(
        `/api/posts?page=${pageParam}&itemsPerPage=${ITEMS_PER_PAGE}&userId=${user.data.id}`
      );
      if (!res.ok) throw new Error("Failed to fetch posts");

      // Read cache status from headers
      const cacheStatus = res.headers.get("X-Cache-Status");
      const cacheKey = res.headers.get("X-Cache-Key");

      if (cacheStatus === "HIT") {
        console.log(`🎯 Cache HIT for ${cacheKey}`);
      } else if (cacheStatus === "MISS") {
        console.log(`❌ Cache MISS for ${cacheKey}`);
      }

      const data = await res.json();

      // API now returns { posts, hasMore, total, currentPage }
      return {
        posts: data.posts || [],
        page: pageParam,
        hasMore: data.hasMore,
        total: data.total,
        nextPage: pageParam + 1,
        cacheStatus, // Include in return for debugging
      };
    },
    getNextPageParam: (lastPage) => {
      // Only return next page if hasMore is true
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    initialPageParam: 1,
    // Enhanced caching strategy
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 min
    gcTime: 5 * 60 * 1000, // 5 minutes - cache garbage collection time (formerly cacheTime)
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

export function useInfinitePostsByAuthorQuery(authorId: string) {
  return useInfiniteQuery({
    queryKey: ["posts", "infinite", authorId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/posts/author/${authorId}?page=${pageParam}&itemsPerPage=${ITEMS_PER_PAGE}`
      );
      if (!res.ok) throw new Error("Failed to fetch posts");

      const data = await res.json();

      // API now returns { posts, hasMore, total, currentPage }
      return {
        posts: data.posts || [],
        page: pageParam,
        hasMore: data.hasMore,
        total: data.total,
        nextPage: pageParam + 1,
      };
    },
    getNextPageParam: (lastPage) => {
      // Only return next page if hasMore is true
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    initialPageParam: 1,
    // Enhanced caching strategy
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 min
    gcTime: 5 * 60 * 1000, // 5 minutes - cache garbage collection time (formerly cacheTime)
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}
