import * as React from "react";

import { DashboardLayout as DashboardLayoutComponent } from "@/components/dashboard/DashboardLayout";

interface FriendsLayoutProps {
  children: React.ReactNode;
}

export default function FriendsLayout({ children }: FriendsLayoutProps) {
  return (
    <>
      <div className="w-full h-full fixed top-0 left-0 z-0 min-h-screen pointer-events-none"></div>
      <div className="relative z-10 min-h-screen">
        <DashboardLayoutComponent rightSidebar={null}>
          {children}
        </DashboardLayoutComponent>
      </div>
    </>
  );
}
