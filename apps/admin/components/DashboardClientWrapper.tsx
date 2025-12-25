"use client";

import * as React from "react";

import { RefreshProvider } from "@/components/analytics/RefreshContext";

export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
  return <RefreshProvider>{children}</RefreshProvider>;
}
