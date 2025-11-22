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
      const posts = await res.json();
      return {
        posts,
        page: pageParam,
        hasMore: posts.length === ITEMS_PER_PAGE,
        nextPage: pageParam + 1,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    initialPageParam: 1,
  });
}
