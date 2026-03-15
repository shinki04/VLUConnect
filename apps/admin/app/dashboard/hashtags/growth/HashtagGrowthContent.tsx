"use client";

import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { cn } from "@repo/ui/lib/utils";
import { format, subDays, subMonths } from "date-fns";
import { CalendarIcon, RefreshCw } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { useIsMobile } from "@repo/ui/hooks/use-mobile";

import {
  getHashtagGrowthStats,
  getHashtagStatsSummary,
  getPostsByHashtagId,
} from "@/app/actions/admin-hashtags";
import type { TimePeriod } from "@/components/charts/ChartTypeSelector";
import { HashtagGrowthChart } from "@/components/charts/HashtagGrowthChart";
import { HashtagPostsTable } from "@/components/hashtags/HashtagPostsTable";
import { HashtagSelector } from "@/components/hashtags/HashtagSelector";
import { HashtagStatsCards } from "@/components/hashtags/HashtagStatsCards";

interface Hashtag {
  id: string;
  name: string;
  post_count: number | null;
}

interface Post {
  id: string;
  content: string;
  created_at: string | null;
  author: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface Stats {
  totalUsage: number;
  growthPercent: number;
  peakDay: { date: string; count: number } | null;
  avgPerDay: number;
}

const DATE_PRESETS = [
  {
    label: "7 ngày qua",
    value: () => ({ from: subDays(new Date(), 7), to: new Date() }),
  },
  {
    label: "30 ngày qua",
    value: () => ({ from: subDays(new Date(), 30), to: new Date() }),
  },
  {
    label: "3 tháng qua",
    value: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
  },
  {
    label: "6 tháng qua",
    value: () => ({ from: subMonths(new Date(), 6), to: new Date() }),
  },
  {
    label: "1 năm qua",
    value: () => ({ from: subMonths(new Date(), 12), to: new Date() }),
  },
];

export function HashtagGrowthContent() {
  const [selectedHashtags, setSelectedHashtags] = React.useState<Hashtag[]>([]);
  const [period, setPeriod] = React.useState<TimePeriod>("daily");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const [chartData, setChartData] = React.useState<
    Record<string, string | number>[]
  >([]);
  const [chartHashtags, setChartHashtags] = React.useState<Hashtag[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [postsPage, setPostsPage] = React.useState(1);
  const [postsTotalPages, setPostsTotalPages] = React.useState(1);
  const [postsTotal, setPostsTotal] = React.useState(0);

  const [chartLoading, setChartLoading] = React.useState(true);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [postsLoading, setPostsLoading] = React.useState(false);

  const isMobile = useIsMobile();

  // Fetch chart data
  const fetchChartData = React.useCallback(async () => {
    setChartLoading(true);
    try {
      const hashtagIds = selectedHashtags.map((h) => h.id);
      const result = await getHashtagGrowthStats(
        period,
        hashtagIds,
        dateRange?.from?.toISOString(),
        dateRange?.to?.toISOString(),
      );
      setChartData(result.data);
      setChartHashtags(result.hashtags);

      // Also update selected hashtags if we got default ones
      if (hashtagIds.length === 0 && result.hashtags.length > 0) {
        setSelectedHashtags(result.hashtags);
      }
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    } finally {
      setChartLoading(false);
    }
  }, [period, selectedHashtags, dateRange]);

  // Fetch stats summary
  const fetchStats = React.useCallback(async () => {
    const hashtagIds =
      selectedHashtags.length > 0
        ? selectedHashtags.map((h) => h.id)
        : chartHashtags.map((h) => h.id);

    if (hashtagIds.length === 0) {
      setStats(null);
      return;
    }

    setStatsLoading(true);
    try {
      const result = await getHashtagStatsSummary(
        hashtagIds,
        dateRange?.from?.toISOString(),
        dateRange?.to?.toISOString(),
      );
      setStats(result);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [selectedHashtags, chartHashtags, dateRange]);

  // Fetch posts for first selected hashtag
  const fetchPosts = React.useCallback(
    async (page: number = 1) => {
      const firstHashtag = selectedHashtags[0] || chartHashtags[0];
      if (!firstHashtag) {
        setPosts([]);
        return;
      }

      setPostsLoading(true);
      try {
        const result = await getPostsByHashtagId(firstHashtag.id, page, 10);
        setPosts(result.posts.filter((p): p is Post => p !== null));
        setPostsPage(result.page);
        setPostsTotalPages(result.totalPages);
        setPostsTotal(result.total);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setPostsLoading(false);
      }
    },
    [selectedHashtags, chartHashtags],
  );

  // Initial fetch
  React.useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Fetch stats when chart data changes
  React.useEffect(() => {
    if (!chartLoading) {
      fetchStats();
    }
  }, [chartLoading, fetchStats]);

  // Fetch posts when selection changes
  React.useEffect(() => {
    if (!chartLoading) {
      fetchPosts(1);
    }
  }, [chartLoading, fetchPosts]);

  const handleRefresh = () => {
    fetchChartData();
  };

  const handlePageChange = (page: number) => {
    fetchPosts(page);
  };

  const firstHashtagName = selectedHashtags[0]?.name || chartHashtags[0]?.name;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base">Bộ lọc</CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Hashtag Selector */}
            <div className="space-y-2">
              <Label>Chọn Hashtag</Label>
              <HashtagSelector
                selectedHashtags={selectedHashtags}
                onSelectionChange={setSelectedHashtags}
                maxSelection={5}
              />
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Khoảng thời gian</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Chọn khoảng thời gian</span>
                    )}
                  </Button>
                </PopoverTrigger>
                {/* <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex">
                    <div className="border-r p-2 space-y-1">
                      {DATE_PRESETS.map((preset) => (
                        <Button
                          key={preset.label}
                          variant="ghost"
                          size="sm"
                          className="justify-start px-2 py-1 text-xs"
                          onClick={() => setDateRange(preset.value())}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </div>
                </PopoverContent> */}
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex flex-col sm:flex-row">
                    {/* Preset column */}
                    <div className="border-b sm:border-b-0 sm:border-r p-2 sm:space-y-1 flex flex-row sm:flex-col items-start overflow-x-auto gap-2 sm:gap-0 w-[calc(100vw-3rem)] sm:w-auto pb-3 sm:pb-2">
                      {DATE_PRESETS.map((preset) => (
                        <Button
                          key={preset.label}
                          variant="ghost"
                          size="sm"
                          className="px-4 py-1 text-sm justify-start whitespace-nowrap"
                          onClick={() => setDateRange(preset.value())}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>

                    {/* Calendar */}
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={isMobile ? 1 : 2}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <HashtagStatsCards stats={stats} loading={statsLoading} />

      {/* Growth Chart */}
      <HashtagGrowthChart
        data={chartData}
        hashtags={chartHashtags}
        loading={chartLoading}
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* Posts Table */}
      <HashtagPostsTable
        posts={posts}
        loading={postsLoading}
        page={postsPage}
        totalPages={postsTotalPages}
        total={postsTotal}
        onPageChange={handlePageChange}
        selectedHashtagName={firstHashtagName}
      />
    </div>
  );
}
