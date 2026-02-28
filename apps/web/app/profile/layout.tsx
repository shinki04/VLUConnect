import * as React from "react";

import { Header } from "@/components/dashboard/Header";
import { SystemAnnouncementBanner } from "@/components/notifications/SystemAnnouncementBanner";

interface ProfileLayoutProps {
  children: React.ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="bg-dashboard-background text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      <Header hideNavTabs={true} />
      <SystemAnnouncementBanner />
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 lg:px-10 py-6">
        {children}
      </div>
    </div>
  );
}
