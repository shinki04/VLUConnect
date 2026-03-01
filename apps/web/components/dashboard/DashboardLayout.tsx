import * as React from "react";

import { SystemAnnouncementBanner } from "@/components/notifications/SystemAnnouncementBanner";

import { Header } from "./Header";
import { MainContent } from "./MainContent";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  hideNavTabs?: boolean;
  fullWidth?: boolean;
}

export function DashboardLayout({
  children,
  rightSidebar,
  hideNavTabs,
  fullWidth = false,
}: DashboardLayoutProps) {
  return (
    <div className="bg-dashboard-background text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      <Header hideNavTabs={hideNavTabs} />
      <SystemAnnouncementBanner />
      <div
        className={`flex-1 max-w-[1440px] w-full px-4 md:px-6 lg:px-10 py-6 gap-6 grid grid-cols-1 md:grid-cols-[200px_1fr] mx-auto ${
          fullWidth || rightSidebar
            ? "lg:grid-cols-[200px_1fr_240px] xl:grid-cols-[260px_1fr_300px]"
            : "lg:max-w-5xl"
        }`}
      >
        <Sidebar />
        <MainContent>{children}</MainContent>
        {rightSidebar ? (
          <aside className="hidden lg:flex flex-col gap-6 sticky top-24 h-fit">
            {rightSidebar}
          </aside>
        ) : fullWidth ? (
          <div className="hidden lg:block w-full" />
        ) : null}
      </div>
    </div>
  );
}
