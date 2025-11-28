"use client";

import { useState } from "react";
import Link from "next/link";
import { useHashtagTrending } from "@/hooks/useHashtagTrending";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  limit = 10,
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
        <p className="text-sm font-medium text-red-800">
          Failed to load trending hashtags
        </p>
        <p className="text-xs text-red-600 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-sm">Trending Hashtags</h3>
          {isRealtime && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
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
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        )}
      </div>

      {/* Hashtags List */}
      <div className="space-y-2">
        {loading && hashtags.length === 0 ? (
          // Skeleton Loading
          Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))
        ) : hashtags.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No hashtags yet
          </p>
        ) : (
          hashtags.map((tag, index) => (
            <HashtagRow key={tag.id} tag={tag} rank={index + 1} />
          ))
        )}
      </div>

      {/* Footer */}
      {hashtags.length > 0 && (
        <Link
          href="/explore/hashtags"
          className="inline-block text-xs text-primary hover:underline mt-3 pt-3 border-t"
        >
          View all hashtags →
        </Link>
      )}
    </div>
  );
}

/**
 * Component hiển thị một hashtag item
 */
function HashtagRow({
  tag,
  rank,
}: {
  tag: { id: string; name: string; post_count: number };
  rank: number;
}) {
  return (
    <Link
      href={`/explore/hashtag/${tag.name}`}
      className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-accent transition-colors group"
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Rank Badge */}
        <div
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0",
            rank === 1 && "bg-yellow-100 text-yellow-700",
            rank === 2 && "bg-gray-100 text-gray-700",
            rank === 3 && "bg-orange-100 text-orange-700",
            rank > 3 && "bg-slate-100 text-slate-700"
          )}
        >
          {rank}
        </div>

        {/* Hashtag Name */}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            #{tag.name}
          </p>
        </div>
      </div>

      {/* Post Count */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs text-muted-foreground">
          {formatNumber(tag.post_count)}
        </span>
        <span className="text-xs text-muted-foreground">posts</span>
      </div>
    </Link>
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
