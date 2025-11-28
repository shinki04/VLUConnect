"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Post } from "@/types/post";

const ITEMS_PER_PAGE = 10;

export interface PostsPage {
  posts: Post[];
  page: number;
  hasMore: boolean;
}

export function useInfinitePostsQuery() {
  return useInfiniteQuery({
    queryKey: ["posts", "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/posts?page=${pageParam}&itemsPerPage=${ITEMS_PER_PAGE}`
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
  });
}
