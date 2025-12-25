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
import { Ban, FileText, Flag } from "lucide-react";
import Link from "next/link";

import { getDashboardStats } from "@/app/actions/admin-stats";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { PostStatsChart } from "@/components/charts/PostStatsChart";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function PostsAnalyticsPage() {
  const stats = await getDashboardStats();

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
              <BreadcrumbPage>Posts Analytics</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <AnalyticsHeader
          title="Posts Analytics"
          description="Post trends and moderation statistics"
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.posts.total.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Flagged Posts</CardTitle>
              <Flag className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.posts.flagged}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejected Posts</CardTitle>
              <Ban className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.posts.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <Link href={ADMIN_ROUTES.POSTS_ALL} className="text-primary hover:underline text-sm">
                View all posts →
              </Link>
              <Link href={ADMIN_ROUTES.POSTS_FLAGGED} className="text-orange-500 hover:underline text-sm">
                Review flagged →
              </Link>
              <Link href={ADMIN_ROUTES.POSTS_REJECTED} className="text-red-500 hover:underline text-sm">
                View rejected →
              </Link>
            </CardContent>
          </Card>
        </div>

        <PostStatsChart />
      </div>
    </>
  );
}
