import * as React from "react";

import { Header } from "./Header";
import { MainContent } from "./MainContent";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

export function DashboardLayout({
  children,
  rightSidebar,
}: DashboardLayoutProps) {
  return (
    <div className="bg-dashboard-background dark:bg-dashboard-darkBackground text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      <Header />
      <div className="flex-1 max-w-[1440px] mx-auto w-full px-4 md:px-6 lg:px-10 py-6 gap-6 grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr_300px]">
        <Sidebar />
        <MainContent>{children}</MainContent>
        {rightSidebar && (
          <aside className="hidden lg:flex flex-col gap-6 sticky top-24 h-fit">
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
