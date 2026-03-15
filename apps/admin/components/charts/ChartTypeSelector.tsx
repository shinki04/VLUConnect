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
  area: "Biểu đồ diện tích",
  bar: "Biểu đồ cột",
  line: "Biểu đồ đường",
  pie: "Biểu đồ tròn",
  radial: "Biểu đồ radar",
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
  daily: "Ngày",
  weekly: "Tuần",
  monthly: "Tháng",
  yearly: "Năm",
};

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex flex-nowrap gap-1 rounded-lg bg-muted p-1 max-w-full overflow-x-auto overflow-y-hidden scrollbar-none">
      {(Object.keys(periodLabels) as TimePeriod[]).map((period) => (
        <Button
          key={period}
          variant={value === period ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(period)}
          className="h-7 px-2 sm:px-3 text-xs flex-1 sm:flex-none justify-center whitespace-nowrap"
        >
          {periodLabels[period]}
        </Button>
      ))}
    </div>
  );
}
