"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui/components/chart";
import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartType } from "./ChartTypeSelector";

interface DataPoint {
  period?: string;
  name?: string;
  count?: number;
  total?: number;
  flagged?: number;
  rejected?: number;
  [key: string]: string | number | undefined;
}

interface BaseChartProps {
  data: DataPoint[];
  chartType: ChartType;
  dataKey?: string;
  dataKeys?: string[]; // Support multiple data keys
  secondaryDataKey?: string;
  config: ChartConfig;
  className?: string;
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function BaseChart({
  data,
  chartType,
  dataKey = "count",
  dataKeys,
  secondaryDataKey,
  config,
  className,
}: BaseChartProps) {
  // Build list of keys to render
  const keysToRender = dataKeys ?? [dataKey, ...(secondaryDataKey ? [secondaryDataKey] : [])];

  if (chartType === "pie") {
    return (
      <ChartContainer config={config} className={className}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey="period"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
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
    return (
      <ChartContainer config={config} className={className}>
        <RadialBarChart
          innerRadius="10%"
          outerRadius="80%"
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            label={{ position: "insideStart", fill: "#fff" }}
            background
            dataKey={dataKey}
          />
          <Legend />
          <ChartTooltip content={<ChartTooltipContent />} />
        </RadialBarChart>
      </ChartContainer>
    );
  }

  // Sort data by period for proper chart display
  const sortedData = [...data].sort((a, b) => 
    (a.period ?? a.name ?? "").localeCompare(b.period ?? b.name ?? "")
  );

  return (
    <ChartContainer config={config} className={className}>
      {chartType === "area" ? (
        <AreaChart data={sortedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {keysToRender.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={`var(--color-${key})`}
              fill={`var(--color-${key})`}
              fillOpacity={0.3}
            />
          ))}
        </AreaChart>
      ) : chartType === "line" ? (
        <LineChart data={sortedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {keysToRender.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={`var(--color-${key})`}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart data={sortedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {keysToRender.map((key) => (
            <Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={4} />
          ))}
        </BarChart>
      )}
    </ChartContainer>
  );
}
