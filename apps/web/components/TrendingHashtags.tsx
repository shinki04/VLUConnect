"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import { RefreshCw, Search, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useHashtagTrending } from "@/hooks/useHashtagTrending";
import { cn } from "@/lib/utils";

interface TrendingHashtagsProps {
  limit?: number;
  className?: string;
  showRefresh?: boolean;
  enableRealtime?: boolean;
}

/**
 * Component hiển thị top trending hashtags
 * Hỗ trợ Supabase Realtime updates
 */
export function TrendingHashtags({
  limit = 5,
  className,
  showRefresh = true,
  enableRealtime = true,
}: TrendingHashtagsProps) {
  const { hashtags, loading, error, refresh, isRealtime } = useHashtagTrending({
    limit,
    enabled: enableRealtime,
  });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">Lỗi khi tải hashtag</p>
        <p className="text-xs text-red-600 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-base text-foreground">
            Trending Hashtags
          </h3>
          {isRealtime && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100/10 text-green-600 text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        {showRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        )}
      </div>

      {/* Hashtags List */}
      <div className="flex flex-wrap gap-2">
        {loading && hashtags.length === 0 ? (
          // Skeleton Loading
          Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))
        ) : hashtags.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4 w-full">
            Chưa có hashtag nào
          </p>
        ) : (
          hashtags.map((tag) => (
            // <Link
            //   key={tag.id}
            //   href={`/explore/hashtag/${tag.name}`}
            //   className="group flex items-center gap-1.5 rounded-full border border-border bg-accent/50 px-3 py-1.5 text-sm  text-accent-foreground transition-all hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
            // >
            //   <span>#{tag.name}</span>
            //   {/* <span className="text-xs opacity-70 transition-colors group-hover:text-primary">
            //     ({formatNumber(tag.post_count)})
            //   </span> */}
            // </Link>
            <div
              key={tag.id}
              className="group flex items-center gap-1.5 rounded-full border border-border bg-accent/50 px-3 py-1.5 text-sm  text-accent-foreground transition-all hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
            >
              <span>#{tag.name}</span>
              {/* <span className="text-xs opacity-70 transition-colors group-hover:text-primary">
                ({formatNumber(tag.post_count)})
              </span> */}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {/* {hashtags.length > 0 && (
        <div className="mt-4 border-t border-dashboard-border pt-4">
          <Link
            href="/explore/hashtags"
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            Xem tất cả hashtag →
          </Link>
        </div>
      )} */}
    </div>
  );
}

/**
 * Compact version of trending hashtags (for sidebar)
 */
export function TrendingHashtagsCompact({ limit = 5 }: { limit?: number }) {
  const { hashtags, loading } = useHashtagTrending({ limit });

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
        Trending
      </h4>
      {loading
        ? Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))
        : hashtags.map((tag) => (
            <Link
              key={tag.id}
              href={`/explore/hashtag/${tag.name}`}
              className="block py-2 px-2 rounded-md hover:bg-accent transition-colors text-sm"
            >
              <span className="font-medium text-primary">#{tag.name}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {formatNumber(tag.post_count)}
              </span>
            </Link>
          ))}
    </div>
  );
}

/**
 * Hashtag search component
 */
/**
 * Hashtag search component
 */
export function HashtagSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { results, searching, search } = useHashtagTrending() as any;

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length > 0) {
      setOpen(true);
      await search(q);
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search hashtags..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setOpen(true)}
          className="pl-8"
        />
      </div>

      {/* Dropdown Results */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-md shadow-md z-50">
          {searching ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results?.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {results?.map(
                (
                  tag:
                    | { id: string; name: string; post_count: number }
                    | undefined
                ) =>
                  tag && (
                    <Link
                      key={tag.id}
                      href={`/explore/hashtag/${tag.name}`}
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex items-center justify-between px-4 py-2 hover:bg-accent text-sm"
                    >
                      <span className="font-medium">#{tag.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatNumber(tag.post_count)}
                      </span>
                    </Link>
                  )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
