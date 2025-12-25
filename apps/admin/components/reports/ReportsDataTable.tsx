"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { CheckCircle, ChevronLeft, ChevronRight, Eye, MoreHorizontal, XCircle } from "lucide-react";
import * as React from "react";

import { getAllReports, updateReportStatus } from "@/app/actions/admin-reports";
import { useRefresh } from "@/components/common/RefreshContext";

interface Report {
  id: string;
  reported_type: string;
  reported_id: string;
  reason: string;
  description: string | null;
  status: string | null;
  created_at: string | null;
  reporter?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ReportsDataTableProps {
  initialData?: {
    reports: Report[];
    totalPages: number;
    total: number;
  };
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "default",
  reviewed: "secondary",
  resolved: "outline",
  dismissed: "destructive",
};

const typeColors: Record<string, string> = {
  post: "bg-blue-100 text-blue-800",
  comment: "bg-green-100 text-green-800",
  user: "bg-purple-100 text-purple-800",
  message: "bg-orange-100 text-orange-800",
};

export function ReportsDataTable({ initialData }: ReportsDataTableProps) {
  const [reports, setReports] = React.useState<Report[]>(initialData?.reports as Report[] ?? []);
  const [loading, setLoading] = React.useState(!initialData);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(initialData?.totalPages ?? 1);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const { refreshKey } = useRefresh();

  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllReports(page, 20, {
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setReports(result.reports as unknown as Report[]);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  React.useEffect(() => {
    if (isInitialLoad && initialData && statusFilter === "all") {
      setIsInitialLoad(false);
      return;
    }
    
    fetchReports();
  }, [fetchReports, refreshKey, isInitialLoad, initialData, statusFilter]);

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      await updateReportStatus(reportId, newStatus as "pending" | "reviewed" | "resolved" | "dismissed");
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reporter</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="min-w-[200px]">Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={report.reporter?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {(report.reporter?.display_name || "U")[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{report.reporter?.display_name || "Anonymous"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[report.reported_type] || "bg-gray-100"}`}>
                      {report.reported_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{report.reason}</p>
                    {report.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{report.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[report.status ?? ""] || "outline"}>
                      {report.status ?? "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {report.created_at ? new Date(report.created_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(report.id, "reviewed")}>
                          <Eye className="h-4 w-4 mr-2" />
                          Mark as Reviewed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(report.id, "resolved")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(report.id, "dismissed")}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Dismiss
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
