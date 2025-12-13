"use client";

import { PostResponse } from "@repo/shared/types/post";
import { Skeleton } from "@repo/ui/components/skeleton";
import React, { useCallback, useEffect, useRef } from "react";

import PostCard from "@/components/posts/PostCard";
import { useInfinitePostsQuery } from "@/hooks/useInfinitePosts";

import PendingPost from "./PendingPost";

export function InfinitePostsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfinitePostsQuery();

  const observerTarget = useRef<HTMLDivElement>(null);

  // Intersection Observer để detect khi scroll đến bottom
  useEffect(() => {
    if (!observerTarget.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Nếu element đầu tiên đang hiển thị và có trang tiếp theo và không đang tải

        if (entries[0]!.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage(); // Tải trang tiếp theo
        }
      },
      { threshold: 0.1 } // Kích hoạt khi 10% element hiển thị
    );
    // Bắt đầu quan sát element target
    observer.observe(observerTarget.current);
    // Dọn dẹp khi component unmount
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;

      // Tính toán xem có đang gần cuối trang không (cách dưới 200px)
      const isNearBottom =
        target.scrollHeight - (target.scrollTop + target.clientHeight) < 200;

      if (isNearBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  if (isLoading) {
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
        <div className="text-center">
          <p className="text-red-500 font-semibold">Lỗi khi tải bài viết</p>
          <p className="text-sm text-gray-500">
            {error instanceof Error ? error.message : "Có lỗi xảy ra"}
          </p>
        </div>
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div
      className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2"
      onScroll={handleScroll}
    >
      {posts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Chưa có bài viết nào</p>
        </div>
      ) : (
        <>
          <PendingPost />

          {/* Regular fetched posts */}
          {posts.map((post: PostResponse) => (
            <PostCard key={post.id} post={post} />
          ))}

          {/* Observer target cho Intersection Observer */}
          <div ref={observerTarget} className="h-8" />

          {/* Loading state khi fetch next page */}
          {isFetchingNextPage && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={`loading-${i}`}
                  className="h-64 w-full rounded-lg"
                />
              ))}
            </div>
          )}

          {/* No more posts */}
          {!hasNextPage && posts.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-400 text-sm">
                Đã hiển thị tất cả bài viết
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
