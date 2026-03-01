import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface MainLayoutProps {
  children: React.ReactNode;
  rightSidebar: React.ReactNode;
}

export default function MainLayout({ children, rightSidebar }: MainLayoutProps) {
  return (
    <>
      <div className="w-full h-full fixed top-0 left-0 z-0 min-h-screen pointer-events-none"></div>
      <div className="relative z-10 min-h-screen">
        <DashboardLayout rightSidebar={rightSidebar}>
          {children}
        </DashboardLayout>
      </div>
    </>
  );
}
