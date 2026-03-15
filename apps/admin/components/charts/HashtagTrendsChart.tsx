"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
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
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";

import { getTopHashtags } from "@/app/actions/admin-hashtags";
import { useRefresh } from "@/components/analytics/RefreshContext";

import { type ChartType, ChartTypeSelector, PeriodSelector, type TimePeriod } from "./ChartTypeSelector";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const chartConfig: ChartConfig = {
  post_count: {
    label: "Số lượng bài viết",
    color: "var(--chart-1)",
  },
};

export function HashtagTrendsChart() {
  const { refreshKey } = useRefresh();
  const [chartType, setChartType] = React.useState<ChartType>("bar");
  const [period, setPeriod] = React.useState<TimePeriod>("daily");
  const [data, setData] = React.useState<{ name: string; post_count: number }[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTopHashtags(10);
      setData(result as unknown as { name: string; post_count: number }[]);
    } catch (error) {
      console.error("Failed to fetch hashtag stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const renderChart = () => {
    if (chartType === "pie") {
      return (
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <PieChart>
            <Pie
              data={data}
              dataKey="post_count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name }) => `#${name}`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
          </PieChart>
        </ChartContainer>
      );
    }

    if (chartType === "radial") {
      const radialData = data.map((item, index) => ({
        ...item,
        fill: COLORS[index % COLORS.length],
      }));

      return (
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <RadialBarChart innerRadius="10%" outerRadius="80%" data={radialData}>
            <RadialBar
              label={{ position: "insideStart", fill: "#fff" }}
              background
              dataKey="post_count"
            />
            <Legend />
            <ChartTooltip content={<ChartTooltipContent />} />
          </RadialBarChart>
        </ChartContainer>
      );
    }

    return (
      <ChartContainer config={chartConfig} className="h-[400px] w-full">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="post_count" radius={4} barSize={24}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Hashtag hàng đầu</CardTitle>
        <div className="flex items-center w-full sm:w-auto gap-2">
          <div className="flex-1 min-w-0">
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>
          <ChartTypeSelector
            value={chartType}
            onChange={setChartType}
            availableTypes={["bar", "pie", "radial"]}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[350px] w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            No hashtags found
          </div>
        ) : (
          renderChart()
        )}
      </CardContent>
    </Card>
  );
}
