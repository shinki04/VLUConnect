"use client";

import { Button } from "@repo/ui/components/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useRefresh } from "./RefreshContext";

interface AnalyticsHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function AnalyticsHeader({ title, description, children }: AnalyticsHeaderProps) {
  const router = useRouter();
  const { triggerRefresh } = useRefresh();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Refresh server components
    router.refresh();
    // Trigger client-side chart re-fetch
    triggerRefresh();
    // Reset after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Reload
        </Button>
      </div>
    </div>
  );
}
