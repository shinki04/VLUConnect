"use client";

import { PostResponse } from "@repo/shared/types/post";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Bookmark, Loader2 } from "lucide-react";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import PostCard from "@/components/posts/PostCard";
import { useInfiniteSavedPostsQuery } from "@/hooks/useInfinitePosts";

/**
 * Virtualized infinite scrolling list for saved (liked) posts.
 * Same layout as InfinitePostsList but without PendingPost.
 */
export function InfiniteSavedPostsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteSavedPostsQuery();

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleEndReached = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
          <p className="text-red-500 font-semibold">Lỗi khi tải bài viết đã lưu</p>
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
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-dashboard-border rounded-xl">
        <Bookmark className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
        <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
          Bạn chưa lưu bài viết nào
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Các bài viết bạn thả tim sẽ xuất hiện ở đây.
        </p>
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
        Footer: () =>
          isFetchingNextPage ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasNextPage && posts.length > 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-400 text-sm">
                Đã hiển thị tất cả bài viết đã lưu
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
