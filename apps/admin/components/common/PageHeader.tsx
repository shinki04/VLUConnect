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
import { useRouter } from "next/navigation";
import * as React from "react";

import { RefreshProvider, useRefresh } from "./RefreshContext";

export interface BreadcrumbItemType {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItemType[];
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

function PageHeaderContent({
  title,
  description,
  breadcrumbs = [],
  icon,
  actions,
  children,
}: PageHeaderProps) {
  const router = useRouter();
  const { triggerRefresh } = useRefresh();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    triggerRefresh();
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.label}>
                <BreadcrumbItem className="hidden md:block">
                  {item.href ? (
                    <BreadcrumbLink href={item.href}>
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 min-w-0 w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full justify-end sm:justify-end">
            {actions}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className=""
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Tải lại
            </Button>
          </div>
        </div>
        {children}
      </div>
    </>
  );
}

export function PageHeader(props: PageHeaderProps) {
  return (
    <RefreshProvider>
      <PageHeaderContent {...props} />
    </RefreshProvider>
  );
}

// Re-export useRefresh for DataTables to use
export { useRefresh } from "./RefreshContext";
