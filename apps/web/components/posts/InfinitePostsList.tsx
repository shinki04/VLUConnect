"use client";

import { PostResponse } from "@repo/shared/types/post";
import { FeedFilter } from "@repo/shared/types/post";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import PostCard from "@/components/posts/PostCard";
import { useInfinitePostsQuery } from "@/hooks/useInfinitePosts";
import { createClient } from "@repo/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

import PendingPost from "./PendingPost";

/**
 * Virtualized infinite scrolling posts list
 * Uses react-virtuoso for efficient rendering with dynamic heights
 */
interface InfinitePostsListProps {
  showPending?: boolean;
}

export function InfinitePostsList({
  showPending = false,
}: InfinitePostsListProps) {
  const searchParams = useSearchParams();
  const filter = (searchParams.get("filter") as FeedFilter) || "all";

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfinitePostsQuery(filter);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  const [mounted, setMounted] = React.useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setMounted(true);

    const supabase = createClient();
    const channel = supabase
      .channel("public:posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        () => {
          // Invalidate posts to trigger refetch when a new post is inserted
          queryClient.invalidateQueries({ queryKey: ["posts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Handle reaching end of list for infinite scroll
  const handleEndReached = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Prevent hydration mismatch: Server always renders skeleton, client first render matches it.
  if (!mounted || isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center flex flex-col gap-2">
          <p className="text-red-500 font-semibold">Lỗi khi tải bài viết</p>
          <p className="text-sm text-gray-500">
            {error instanceof Error ? error.message : "Có lỗi xảy ra"}
          </p>
          <Button onClick={() => window.location.reload()}>Thử tải lại</Button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Chưa có bài viết nào</p>
      </div>
    );
  }

  return (
    <Virtuoso
      useWindowScroll
      data={posts}
      endReached={handleEndReached}
      overscan={200}
      components={{
        Header: showPending ? () => <PendingPost /> : undefined,
        Footer: () =>
          isFetchingNextPage ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasNextPage && posts.length > 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-400 text-sm">
                Đã hiển thị tất cả bài viết
              </p>
            </div>
          ) : null,
      }}
      itemContent={(index, post: PostResponse) => (
        <div className="pb-4 pr-2">
          <PostCard post={post} />
        </div>
      )}
    />
  );
}
