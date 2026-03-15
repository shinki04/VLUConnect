"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui/components/chart";
import { Skeleton } from "@repo/ui/components/skeleton";
import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { getReportStats } from "@/app/actions/admin-stats";
import { useRefresh } from "@/components/analytics/RefreshContext";

import { type ChartType, ChartTypeSelector, PeriodSelector, type TimePeriod } from "./ChartTypeSelector";

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--chart-1)",
  reviewed: "var(--chart-2)",
  resolved: "var(--chart-3)",
  dismissed: "var(--chart-4)",
};

const chartConfig: ChartConfig = {
  count: {
    label: "Số lượng",
    color: "var(--chart-1)",
  },
};

export function ReportsChart() {
  const { refreshKey } = useRefresh();
  const [data, setData] = React.useState<{
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
    total: number;
  }>({ byStatus: [], byType: [], total: 0 });
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState<TimePeriod>("daily");
  const [chartType, setChartType] = React.useState<ChartType>("pie");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getReportStats();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch report stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey, period]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    if (data.byStatus.length === 0) {
      return (
        <div className="flex h-[350px] items-center justify-center text-muted-foreground">
          Chưa có báo cáo nào
        </div>
      );
    }

    if (chartType === "pie") {
      return (
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <PieChart>
            <Pie
              data={data.byStatus}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ status, count }) => `${status}: ${count}`}
            >
              {data.byStatus.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] ?? "var(--chart-5)"}
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
          </PieChart>
        </ChartContainer>
      );
    }

    return (
      <ChartContainer config={chartConfig} className="h-[350px] w-full">
        <BarChart data={data.byStatus}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" radius={4}>
            {data.byStatus.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? "var(--chart-5)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Báo cáo theo trạng thái</CardTitle>
          <CardDescription>Tổng: {data.total} báo cáo</CardDescription>
        </div>
        <div className="flex items-center w-full sm:w-auto gap-2">
          <div className="flex-1 min-w-0">
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>
          <ChartTypeSelector 
            value={chartType} 
            onChange={setChartType}
            availableTypes={["pie", "bar"]}
          />
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}
