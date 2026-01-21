"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
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
import { format } from "date-fns";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Filter,
  MoreHorizontal,
  XCircle,
} from "lucide-react";
import * as React from "react";

import { getAllReports, ReportFilterStatusType, ReportFilterType, updateReportStatus } from "@/app/actions/admin-reports";
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

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

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

// Helper function to generate page numbers with ellipsis
function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("...");
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push("...");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("...");
    for (let i = current - 1; i <= current + 1; i++) pages.push(i);
    pages.push("...");
    pages.push(total);
  }
  
  return pages;
}

export function ReportsDataTable({ initialData }: ReportsDataTableProps) {
  const [reports, setReports] = React.useState<Report[]>(initialData?.reports as Report[] ?? []);
  const [loading, setLoading] = React.useState(!initialData);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(initialData?.totalPages ?? 1);
  const [totalCount, setTotalCount] = React.useState(initialData?.total ?? 0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [statusFilter, setStatusFilter] = React.useState<ReportFilterStatusType>("all");
  const [typeFilter, setTypeFilter] = React.useState<ReportFilterType>("all");
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [selectedReport, setSelectedReport] = React.useState<Report | null>(null);
  const { refreshKey } = useRefresh();

  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllReports(page, rowsPerPage, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
      });
      setReports(result.reports as unknown as Report[]);
      setTotalPages(result.totalPages);
      setTotalCount(result.total);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, typeFilter]);

  React.useEffect(() => {
    if (isInitialLoad && initialData && statusFilter === "all" && typeFilter === "all") {
      setIsInitialLoad(false);
      return;
    }
    
    fetchReports();
  }, [fetchReports, refreshKey, isInitialLoad, initialData, statusFilter, typeFilter]);

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

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value));
    setPage(1);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filters Row */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Bộ lọc:</span>
          </div>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as ReportFilterStatusType); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="pending">Đang chờ</SelectItem>
              <SelectItem value="reviewed">Đã xem xét</SelectItem>
              <SelectItem value="resolved">Đã giải quyết</SelectItem>
              <SelectItem value="dismissed">Bỏ qua</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as ReportFilterType); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="post">Bài viết</SelectItem>
              <SelectItem value="comment">Bình luận</SelectItem>
              <SelectItem value="user">Người dùng</SelectItem>
              <SelectItem value="message">Tin nhắn</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Dòng:</span>
            <Select value={String(rowsPerPage)} onValueChange={handleRowsPerPageChange}>
              <SelectTrigger className="w-[70px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người tố cáo</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>ID bị tố cáo</TableHead>
                <TableHead className="min-w-[200px]">Lý do</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="w-[100px]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Không tìm thấy tố cáo nào
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow 
                    key={report.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedReport(report)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={report.reporter?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {(report.reporter?.display_name || "U")[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{report.reporter?.display_name || "Ẩn danh"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[report.reported_type] || "bg-gray-100"}`}>
                        {report.reported_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground">
                        {report.reported_id.slice(0, 8)}...
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
                        {report.status ?? "Không rõ"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {report.created_at ? format(new Date(report.created_at), "MMM d, HH:mm") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(report);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Cập nhật trạng thái</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusChange(report.id, "reviewed")}>
                              <Eye className="h-4 w-4 mr-2" />
                              Đánh dấu đã xem xét
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(report.id, "resolved")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Đánh dấu đã giải quyết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(report.id, "dismissed")}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Bỏ qua
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Trang {page} / {totalPages || 1}
          </span>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page <= 1}
            >
              Đầu
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {generatePageNumbers(page, totalPages).map((pageNum, idx) => (
              pageNum === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  className="w-9"
                  onClick={() => setPage(pageNum as number)}
                >
                  {pageNum}
                </Button>
              )
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              Cuối
            </Button>
          </div>
        </div>
      </div>

      {/* Report Detail Dialog */}
      <ReportDetailDialog
        report={selectedReport}
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}

interface ReportDetailDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (reportId: string, status: string) => void;
}

function ReportDetailDialog({ report, open, onOpenChange, onStatusChange }: ReportDetailDialogProps) {
  if (!report) return null;

  const getTargetUrl = (type: string, id: string) => {
    switch (type) {
      case "post":
        return `/dashboard/posts/all?search=${id}`;
      case "comment":
        return `/dashboard/comments?search=${id}`;
      case "user":
        return `/dashboard/users?search=${id}`;
      default:
        return null;
    }
  };

  const targetUrl = getTargetUrl(report.reported_type, report.reported_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Chi tiết tố cáo
            <Badge variant={statusColors[report.status ?? ""] || "outline"}>
              {report.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reporter Info */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-semibold text-sm">Người tố cáo</h4>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={report.reporter?.avatar_url || undefined} />
                <AvatarFallback>
                  {(report.reporter?.display_name || "U")[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{report.reporter?.display_name || "Ẩn danh"}</p>
                {report.reporter?.username && (
                  <p className="text-sm text-muted-foreground">@{report.reporter.username}</p>
                )}
              </div>
            </div>
          </div>

          {/* Reported Target */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-semibold text-sm">Đối tượng bị tố cáo</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Loại:</div>
              <div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[report.reported_type] || "bg-gray-100"}`}>
                  {report.reported_type}
                </span>
              </div>
              <div className="text-muted-foreground">ID:</div>
              <div className="font-mono text-xs break-all">{report.reported_id}</div>
            </div>
            {targetUrl && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={targetUrl}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Xem {report.reported_type}
                </a>
              </Button>
            )}
          </div>

          {/* Reason & Description */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-semibold text-sm">Lý do</h4>
            <p className="text-sm font-medium">{report.reason}</p>
            {report.description && (
              <>
                <h4 className="font-semibold text-sm pt-2">Mô tả</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.description}</p>
              </>
            )}
          </div>

          {/* Metadata */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-semibold text-sm">Thông tin khác</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Ngày tạo:</div>
              <div>
                {report.created_at ? format(new Date(report.created_at), "PPpp") : "-"}
              </div>
              <div className="text-muted-foreground">ID tố cáo:</div>
              <div className="font-mono text-xs break-all">{report.id}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onStatusChange(report.id, "reviewed");
                onOpenChange(false);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Đã xem xét
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onStatusChange(report.id, "resolved");
                onOpenChange(false);
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Đã giải quyết
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onStatusChange(report.id, "dismissed");
                onOpenChange(false);
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Bỏ qua
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
