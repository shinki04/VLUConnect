import { SidebarInset, SidebarProvider } from "@repo/ui/components/sidebar";

import { getCurrentUser } from "@/app/actions/user";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardClientWrapper } from "@/components/DashboardClientWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <DashboardClientWrapper>{children}</DashboardClientWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}
