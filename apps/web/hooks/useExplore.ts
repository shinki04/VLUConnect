"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useGetCurrentUser } from "./useAuth";

const ITEMS_PER_PAGE = 10;

/**
 * Hook to fetch posts by hashtag with infinite scroll
 */
export function useInfinitePostsByHashtag(hashtagName: string) {
  const user = useGetCurrentUser();
  return useInfiniteQuery({
    queryKey: ["posts", "hashtag", hashtagName],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/posts/hashtag/${encodeURIComponent(hashtagName)}?page=${pageParam}&itemsPerPage=${ITEMS_PER_PAGE}`
      );
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      return {
        posts: data.posts || [],
        page: pageParam,
        hasMore: data.hasMore,
        total: data.total,
        nextPage: pageParam + 1,
        hashtag: data.hashtag,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!hashtagName && !!user?.data?.id,
  });
}

/**
 * Hook to search posts by content with infinite scroll
 */
export function useSearchPosts(query: string) {
  const user = useGetCurrentUser();
  return useInfiniteQuery({
    queryKey: ["posts", "search", query],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/posts/search?q=${encodeURIComponent(query)}&page=${pageParam}&itemsPerPage=${ITEMS_PER_PAGE}`
      );
      if (!res.ok) throw new Error("Failed to search posts");
      const data = await res.json();
      return {
        posts: data.posts || [],
        page: pageParam,
        hasMore: data.hasMore,
        total: data.total,
        nextPage: pageParam + 1,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!query.trim() && !!user?.data?.id,
  });
}
