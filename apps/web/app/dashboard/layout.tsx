import * as React from "react";

// Use the new DashboardLayout
import { DashboardLayout as DashboardLayoutComponent } from "@/components/dashboard/DashboardLayout";
import { TrendingHashtags } from "@/components/TrendingHashtags";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      <div className="w-full h-full fixed top-0 left-0 z-0 min-h-screen pointer-events-none">
      </div>
      <div className="relative z-10">
        <DashboardLayoutComponent
          rightSidebar={<TrendingHashtags className="w-full hidden lg:block" />}
        >
          {children}
        </DashboardLayoutComponent>
      </div>
    </>
  );
}
