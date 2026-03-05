import { User } from "@repo/shared/types/user";
import * as React from "react";

import { SystemAnnouncementBanner } from "@/components/notifications/SystemAnnouncementBanner";

import { MainContent } from "./MainContent";
import { MobileNav } from "./MobileNav";
interface DashboardLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  hideNavTabs?: boolean;
}

export function DashboardLayout({
  children,
  header,
  leftSidebar,
  rightSidebar,
  currentUser,
  unreadCount,
}: DashboardLayoutProps & {
  currentUser?: User | null;
  unreadCount?: number;
}) {
  return (
    <div className="bg-dashboard-background text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      {header}
      <SystemAnnouncementBanner />
      <div className="flex-1 max-w-[1440px] w-full px-4 md:px-6 lg:px-10 py-6 gap-6 mx-auto flex items-start justify-center">
        {/* Left Sidebar */}
        <aside className="hidden md:flex flex-col gap-6 sticky top-24 h-fit w-[200px] xl:w-[260px] shrink-0">
          {leftSidebar}
        </aside>

        {/* Center Content */}
        <div className="flex-1 min-w-0 w-full">
          <MainContent>{children}</MainContent>
        </div>

        {/* Right Sidebar */}
        {rightSidebar && (
          <aside className="hidden lg:flex flex-col gap-6 sticky top-24 h-fit w-[240px] xl:w-[300px] shrink-0 empty:hidden">
            {rightSidebar}
          </aside>
        )}
      </div>

      {/* Mobile Navigation Bar */}
      {currentUser !== undefined && (
        <MobileNav currentUser={currentUser} unreadCount={unreadCount} />
      )}
    </div>
  );
}
