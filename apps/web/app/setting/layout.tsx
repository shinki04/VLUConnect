import * as React from "react";

import { getTotalUnreadCount } from "@/app/actions/messaging";
import { getCurrentUser } from "@/app/actions/user";
import { Header } from "@/components/dashboard/Header";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { SettingMobileNav } from "@/components/setting/SettingMobileNav";
import { SettingSidebar } from "@/components/setting/SettingSidebar";

interface SettingLayoutProps {
  children: React.ReactNode;
}

export default async function SettingLayout({ children }: SettingLayoutProps) {
  const [currentUser, unreadCount] = await Promise.all([
    getCurrentUser().catch(() => null),
    getTotalUnreadCount().catch(() => 0),
  ]);

  return (
    <div className="bg-dashboard-background text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      <Header
        hideNavTabs={true}
        centerContent={
          <div className="flex items-center w-full justify-start md:justify-center">
            <SettingMobileNav />
            <h2 className="text-lg font-bold hidden md:block text-slate-900 dark:text-slate-100">
              Cài đặt hệ thống
            </h2>
          </div>
        }
      />
      <div className="flex-1 max-w-screen-2xl w-full px-4 md:px-6 lg:px-10 py-6 pb-24 md:pb-6 gap-6 mx-auto flex items-start justify-center">
        {/* Left Sidebar specific to Settings */}
        <aside className="hidden md:flex flex-col gap-6 sticky top-24 h-fit shrink-0">
          <SettingSidebar />
        </aside>

        {/* Center Content without right sidebar */}
        <div className="flex-1 min-w-0 w-full max-w-4xl border border-dashboard-border bg-dashboard-sidebar rounded-xl min-h-[50vh]">
          {children}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <MobileNav currentUser={currentUser} unreadCount={unreadCount} />
    </div>
  );
}
