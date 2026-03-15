"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import type { ChartConfig } from "@repo/ui/components/chart";
import { Skeleton } from "@repo/ui/components/skeleton";
import * as React from "react";

import { BaseChart } from "./BaseChart";
import { type ChartType, ChartTypeSelector, PeriodSelector, type TimePeriod } from "./ChartTypeSelector";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface HashtagGrowthChartProps {
  data: Record<string, string | number>[];
  hashtags: { id: string; name: string; post_count: number | null }[];
  loading: boolean;
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

export function HashtagGrowthChart({
  data,
  hashtags,
  loading,
  period,
  onPeriodChange,
}: HashtagGrowthChartProps) {
  const [chartType, setChartType] = React.useState<ChartType>("line");

  // Build chart config dynamically based on hashtags
  const chartConfig: ChartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    hashtags.forEach((hashtag, index) => {
      config[hashtag.name] = {
        label: `#${hashtag.name}`,
        color: COLORS[index % COLORS.length],
      };
    });
    return config;
  }, [hashtags]);

  const dataKeys = hashtags.map((h) => h.name);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Xu hướng tăng trưởng Hashtag</CardTitle>
        <div className="flex items-center w-full sm:w-auto gap-2">
          <div className="flex-1 min-w-0">
            <PeriodSelector value={period} onChange={onPeriodChange} />
          </div>
          <ChartTypeSelector
            value={chartType}
            onChange={setChartType}
            availableTypes={["line", "area", "bar"]}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[350px] w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            Không có dữ liệu
          </div>
        ) : (
          <BaseChart
            data={data}
            chartType={chartType}
            dataKeys={dataKeys}
            config={chartConfig}
            className="h-[400px] w-full"
          />
        )}
      </CardContent>
    </Card>
  );
}
