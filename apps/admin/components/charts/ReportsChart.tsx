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

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--chart-1)",
  reviewed: "var(--chart-2)",
  resolved: "var(--chart-3)",
  dismissed: "var(--chart-4)",
};

const TYPE_COLORS: Record<string, string> = {
  post: "var(--chart-1)",
  comment: "var(--chart-2)",
  user: "var(--chart-3)",
  message: "var(--chart-4)",
};

const chartConfig: ChartConfig = {
  count: {
    label: "Count",
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
  }, [fetchData, refreshKey]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Reports by Status</CardTitle>
          <CardDescription>Total: {data.total} reports</CardDescription>
        </CardHeader>
        <CardContent>
          {data.byStatus.length === 0 ? (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
              No reports yet
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <PieChart>
                <Pie
                  data={data.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reports by Type</CardTitle>
          <CardDescription>What&apos;s being reported</CardDescription>
        </CardHeader>
        <CardContent>
          {data.byType.length === 0 ? (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
              No reports yet
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <BarChart data={data.byType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={4}>
                  {data.byType.map((entry) => (
                    <Cell
                      key={entry.type}
                      fill={TYPE_COLORS[entry.type] ?? "var(--chart-5)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
