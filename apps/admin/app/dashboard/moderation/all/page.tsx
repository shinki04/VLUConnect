"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { Button } from "@repo/ui/components/button";
import { Separator } from "@repo/ui/components/separator";
import { SidebarTrigger } from "@repo/ui/components/sidebar";
import { RefreshCw } from "lucide-react";
import * as React from "react";

import { getModerationActions, ModerationAction } from "@/app/actions/moderation";
import { ModerationTable , ModerationTableFilters} from "@/components/moderation/ModerationTable";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default function ModerationAllActionsPage() {
  const [data, setData] = React.useState<ModerationAction[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<ModerationTableFilters>({
    rowsPerPage: 20,
    targetType: "all",
    actionType: "all",
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const actionsRes = await getModerationActions(page, filters.rowsPerPage, {
        actionType: filters.actionType,
        targetType: filters.targetType,
      });
      setData(actionsRes.data);
      setTotalPages(actionsRes.totalPages);
      setTotalCount(actionsRes.total);
    } catch (error) {
      console.error("Failed to load moderation actions", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFiltersChange = (newFilters: ModerationTableFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

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
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={ADMIN_ROUTES.MODERATION}>Quản lý kiểm duyệt</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Danh sách bài đã kiểm duyệt</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Tải lại
          </Button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Danh sách bài đã kiểm duyệt</h2>
          <p className="text-muted-foreground">
            Xem và quản lý tất cả hành động kiểm duyệt trên hệ thống
          </p>
        </div>

        <ModerationTable
          data={data}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </div>
    </>
  );
}

