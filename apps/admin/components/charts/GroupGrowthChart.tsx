"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import type { ChartConfig } from "@repo/ui/components/chart";
import { Skeleton } from "@repo/ui/components/skeleton";
import * as React from "react";

import { getGroupStats } from "@/app/actions/admin-stats";
import { useRefresh } from "@/components/analytics/RefreshContext";

import { BaseChart } from "./BaseChart";
import { type ChartType, ChartTypeSelector, PeriodSelector, type TimePeriod } from "./ChartTypeSelector";

const chartConfig: ChartConfig = {
  count: {
    label: "Nhóm mới",
    color: "var(--chart-2)",
  },
};

export function GroupGrowthChart() {
  const { refreshKey } = useRefresh();
  const [chartType, setChartType] = React.useState<ChartType>("area");
  const [period, setPeriod] = React.useState<TimePeriod>("daily");
  const [data, setData] = React.useState<{ period: string; count: number }[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getGroupStats(period);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch group stats:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Tăng trưởng nhóm</CardTitle>
        <div className="flex items-center w-full sm:w-auto gap-2">
          <div className="flex-1 min-w-0">
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>
          <ChartTypeSelector
            value={chartType}
            onChange={setChartType}
            availableTypes={["area", "bar", "line"]}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[350px] w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <BaseChart
            data={data}
            chartType={chartType}
            dataKey="count"
            config={chartConfig}
            className="h-[400px] w-full"
          />
        )}
      </CardContent>
    </Card>
  );
}
