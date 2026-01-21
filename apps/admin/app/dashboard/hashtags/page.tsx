import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { Separator } from "@repo/ui/components/separator";
import { SidebarTrigger } from "@repo/ui/components/sidebar";

import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { HashtagTrendsChart } from "@/components/charts/HashtagTrendsChart";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function HashtagsAnalyticsPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={ADMIN_ROUTES.DASHBOARD}>Bảng điều khiển</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Thống kê hashtag</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <AnalyticsHeader
          title="Thống kê hashtag"
          description="Các hashtag đang thịnh hành trên hệ thống"
        />
        <HashtagTrendsChart />
      </div>
    </>
  );
}

