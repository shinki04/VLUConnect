"use client";

import { RefreshCw, ChevronDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useHashtagTrending } from "@/hooks/useHashtagTrending";
import { cn } from "@/lib/utils";

interface TrendingHashtagsProps {
  limit?: number;
  className?: string;
  showRefresh?: boolean;
  enableRealtime?: boolean;
}

export function TrendingHashtags({
  limit = 6,
  className,
  showRefresh = true,
  enableRealtime = true,
}: TrendingHashtagsProps) {
  const { hashtags, loading, error, refresh, isRealtime } =
    useHashtagTrending({ limit, enabled: enableRealtime });

  if (error)
    return (
      <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
        Lỗi tải dữ liệu
      </div>
    );

  return (
    <div
      className={cn(
        "bg-white rounded-[24px] p-6 shadow-sm border border-white/60",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#EF4444]" />
          <h3 className="font-bold text-[#37426F] text-[18px]">
            Trending Hashtags
          </h3>

          {/* Realtime indicator */}
          {isRealtime && (
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          )}
        </div>

        {/* Refresh Button */}
        {showRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
          >
            <RefreshCw
              className={cn(
                "w-3.5 h-3.5 text-gray-400",
                loading && "animate-spin"
              )}
            />
          </Button>
        )}
      </div>

      {/* List */}
      <div className="space-y-4">
        {/* Skeleton */}
        {loading && hashtags.length === 0
          ? Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))
          : hashtags.length === 0
            ? (
              <p className="text-center text-xs text-gray-400 py-4">
                Chưa có dữ liệu
              </p>
            )
            : hashtags.map((tag, index) => {
              const rank = index + 1;
              const { borderColor, textColor } = getRankStyle(rank);

              return (
                <Link
                  key={tag.id}
                  href={`/explore/hashtag/${tag.name}`}
                  className="flex items-center gap-4 pb-3 border-b border-gray-50 last:border-0 group cursor-pointer hover:bg-gray-50 rounded-lg px-1 transition-colors"
                >
                  {/* Rank badge */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold border-[1.5px] bg-white shadow-sm transition-transform group-hover:scale-110",
                      borderColor,
                      textColor
                    )}
                  >
                    {rank}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-[#EF4444] group-hover:underline truncate">
                      #{tag.name}
                    </p>
                    <p className="text-[12px] text-gray-400 font-medium">
                      {formatNumber(tag.post_count)} bài viết
                    </p>
                  </div>
                </Link>
              );
            })}
      </div>

      {/* Show More */}
      {!loading && hashtags.length > 0 && (
        <div className="text-center pt-2">
          <Link
            href="/explore/hashtags"
            className="text-sm text-gray-400 hover:text-[#37426F] font-medium flex items-center justify-center gap-1"
          >
            Xem thêm <ChevronDown className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

/* =============================== */
/* Helpers */
/* =============================== */

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return {
        borderColor: "border-yellow-400",
        textColor: "text-yellow-600",
      };
    case 2:
      return {
        borderColor: "border-slate-400",
        textColor: "text-slate-600",
      };
    case 3:
      return {
        borderColor: "border-orange-400",
        textColor: "text-orange-600",
      };
    default:
      return {
        borderColor: "border-[#EF4444]",
        textColor: "text-[#EF4444]",
      };
  }
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
