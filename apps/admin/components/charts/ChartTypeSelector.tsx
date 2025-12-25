"use client";

import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { AreaChart, BarChart3, LineChart, PieChart, Radar } from "lucide-react";
import * as React from "react";

export type ChartType = "area" | "bar" | "line" | "pie" | "radial";

interface ChartTypeSelectorProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
  availableTypes?: ChartType[];
}

const chartIcons: Record<ChartType, React.ElementType> = {
  area: AreaChart,
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  radial: Radar,
};

const chartLabels: Record<ChartType, string> = {
  area: "Area Chart",
  bar: "Bar Chart",
  line: "Line Chart",
  pie: "Pie Chart",
  radial: "Radial Chart",
};

export function ChartTypeSelector({
  value,
  onChange,
  availableTypes = ["area", "bar", "line"],
}: ChartTypeSelectorProps) {
  const CurrentIcon = chartIcons[value];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          {chartLabels[value]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableTypes.map((type) => {
          const Icon = chartIcons[type];
          return (
            <DropdownMenuItem
              key={type}
              onClick={() => onChange(type)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {chartLabels[type]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Period selector for time-based charts
export type TimePeriod = "daily" | "weekly" | "monthly" | "yearly";

interface PeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

const periodLabels: Record<TimePeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {(Object.keys(periodLabels) as TimePeriod[]).map((period) => (
        <Button
          key={period}
          variant={value === period ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(period)}
          className="h-7 px-3 text-xs"
        >
          {periodLabels[period]}
        </Button>
      ))}
    </div>
  );
}
