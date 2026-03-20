"use client";

import { PostResponse } from "@repo/shared/types/post";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ArrowLeft, Hash, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import PostCard from "@/components/posts/PostCard";
import { useInfinitePostsByHashtag } from "@/hooks/useExplore";

export default function HashtagPostsPage() {
  const params = useParams();
  const hashtagName = decodeURIComponent(params.name as string);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfinitePostsByHashtag(hashtagName);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];
  const totalPosts = data?.pages[0]?.total ?? 0;

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
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center flex flex-col gap-2">
            <p className="text-red-500 font-semibold">Lỗi khi tải bài viết</p>
            <p className="text-sm text-gray-500">
              {error instanceof Error ? error.message : "Có lỗi xảy ra"}
            </p>
            <Button onClick={() => window.location.reload()}>
              Thử tải lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại khám phá
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              #{hashtagName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {totalPosts} bài viết
            </p>
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Hash className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">
            Chưa có bài viết nào với hashtag này
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Hãy tạo bài viết đầu tiên với #{hashtagName}
          </p>
        </div>
      ) : (
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
                    Đã hiển thị tất cả bài viết
                  </p>
                </div>
              ) : null,
          }}
          itemContent={(_index, post: PostResponse) => (
            <div className="pb-4">
              <PostCard post={post} />
            </div>
          )}
        />
      )}
    </div>
  );
}
