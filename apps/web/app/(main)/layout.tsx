import * as React from "react";

import { getTotalUnreadCount } from "@/app/actions/messaging";
import { getCurrentUser } from "@/app/actions/user";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface MainLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  leftSidebar: React.ReactNode;
  rightSidebar: React.ReactNode;
}

export default async function MainLayout({
  children,
  header,
  leftSidebar,
  rightSidebar,
}: MainLayoutProps) {
  const [currentUser, unreadCount] = await Promise.all([
    getCurrentUser().catch(() => null),
    getTotalUnreadCount().catch(() => 0)
  ]);

  return (
    <>
      <div className="w-full h-full fixed top-0 left-0 z-0 min-h-screen pointer-events-none"></div>
      <div className="relative z-10 min-h-screen pb-16 md:pb-0">
        <DashboardLayout
          header={header}
          leftSidebar={leftSidebar}
          rightSidebar={rightSidebar}
          currentUser={currentUser}
          unreadCount={unreadCount}
        >
          {children}
        </DashboardLayout>
      </div>
    </>
  );
}
