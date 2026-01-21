import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";
import { SidebarTrigger } from "@repo/ui/components/sidebar";
import { Globe, Grid, Lock } from "lucide-react";
import Link from "next/link";

import { getGroupOverviewStats } from "@/app/actions/admin-stats";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { GroupGrowthChart } from "@/components/charts/GroupGrowthChart";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function GroupsAnalyticsPage() {
  const stats = await getGroupOverviewStats();

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={ADMIN_ROUTES.DASHBOARD}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Groups Analytics</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <AnalyticsHeader
          title="Groups Analytics"
          description="Group creation trends and statistics"
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              <Grid className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">New Today</CardTitle>
              <Grid className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">+{stats.today}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Public Groups</CardTitle>
              <Globe className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.public}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Private Groups</CardTitle>
              <Lock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.private}</div>
              <Link href={ADMIN_ROUTES.GROUPS_MANAGE} className="text-xs text-primary hover:underline">
                Manage groups →
              </Link>
            </CardContent>
          </Card>
        </div>

        <GroupGrowthChart />
      </div>
    </>
  );
}
