"use client";

import { PostResponse } from "@repo/shared/types/post";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Hash, Loader2, Search, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import PostCard from "@/components/posts/PostCard";
import { useSearchPosts } from "@/hooks/useExplore";
import { useHashtagTrending } from "@/hooks/useHashtagTrending";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { hashtags, loading: hashtagsLoading } = useHashtagTrending({
    limit: 20,
    enabled: true,
  });

  const {
    data: searchData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: searchLoading,
  } = useSearchPosts(debouncedQuery);

  const searchResults =
    searchData?.pages.flatMap((page) => page.posts) ?? [];
  const totalResults = searchData?.pages[0]?.total ?? 0;
  const isSearching = debouncedQuery.length > 0;

  const handleEndReached = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Khám phá</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tìm kiếm bài viết hoặc khám phá các hashtag thịnh hành
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Tìm kiếm bài viết theo nội dung..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-11 rounded-xl bg-dashboard-card border-dashboard-border"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setDebouncedQuery("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {isSearching ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {searchLoading
                ? "Đang tìm kiếm..."
                : `Tìm thấy ${totalResults} bài viết cho "${debouncedQuery}"`}
            </p>
          </div>

          {searchLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">
                Không tìm thấy bài viết nào
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Thử tìm kiếm với từ khóa khác
              </p>
            </div>
          ) : (
            <Virtuoso
              useWindowScroll
              data={searchResults}
              endReached={handleEndReached}
              overscan={200}
              components={{
                Footer: () =>
                  isFetchingNextPage ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !hasNextPage && searchResults.length > 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-gray-400 text-sm">
                        Đã hiển thị tất cả kết quả
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
      ) : (
        /* Trending Hashtags */
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-foreground">
              Hashtag thịnh hành
            </h2>
          </div>

          {hashtagsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : hashtags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Hash className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                Chưa có hashtag nào
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {hashtags.map((tag, index) => (
                <Link
                  key={tag.id}
                  href={`/explore/hashtag/${tag.name}`}
                  className="group relative overflow-hidden rounded-xl border border-border bg-dashboard-card p-4 transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {tag.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {tag.post_count} bài viết
                    </span>
                  </div>
                  {index < 3 && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold">
                        #{index + 1}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
