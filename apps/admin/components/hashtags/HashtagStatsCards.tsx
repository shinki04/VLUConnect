"use client";

import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ArrowDown, ArrowUp, Calendar, Hash, TrendingUp } from "lucide-react";

interface HashtagStatsCardsProps {
  stats: {
    totalUsage: number;
    growthPercent: number;
    peakDay: { date: string; count: number } | null;
    avgPerDay: number;
  } | null;
  loading: boolean;
}

export function HashtagStatsCards({ stats, loading }: HashtagStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const isGrowthPositive = stats.growthPercent >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 wrap-break-word ">
            <Hash className="h-4 w-4" />
            <span>Tổng lượt dùng</span>
          </div>
          <p className="text-2xl font-bold">
            {stats.totalUsage.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 wrap-break-word">
            <TrendingUp className="h-4 w-4" />
            <span>Tăng trưởng</span>
          </div>
          <div className="flex items-center gap-1">
            <p
              className={`text-2xl font-bold ${isGrowthPositive ? "text-green-600" : "text-red-600"}`}
            >
              {isGrowthPositive ? "+" : ""}
              {stats.growthPercent}%
            </p>
            {isGrowthPositive ? (
              <ArrowUp className="h-5 w-5 text-green-600" />
            ) : (
              <ArrowDown className="h-5 w-5 text-red-600" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 wrap-break-word">
            <Calendar className="h-4 w-4" />
            <span>Ngày cao điểm</span>
          </div>
          {stats.peakDay ? (
            <div>
              <p className="text-lg font-bold">
                {stats.peakDay.count} bài viết
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(stats.peakDay.date).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">-</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 wrap-break-word">
            <TrendingUp className="h-4 w-4" />
            <span>Trung bình mỗi ngày</span>
          </div>
          <p className="text-2xl font-bold">
            {stats.avgPerDay.toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
