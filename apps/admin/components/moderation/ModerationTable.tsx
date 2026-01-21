"use client";

import { ModerationActionType } from "@repo/shared/types/moderation";
import { ReportType } from "@repo/shared/types/report";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
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
import { ChevronLeft, ChevronRight, ExternalLink, Eye, Filter } from "lucide-react";
import * as React from "react";

import type { ModerationAction } from "@/app/actions/moderation";

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

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

const TARGET_TYPES = [
  { value: "all", label: "Tất cả đối tượng" },
  { value: "post", label: "Bài viết" },
  { value: "comment", label: "Bình luận" },
  { value: "message", label: "Tin nhắn" },
  { value: "group", label: "Nhóm" },
] as const;

const ACTION_TYPES = [
  { value: "all", label: "Tất cả hành động" },
  { value: "keyword_blocked", label: "Chặn từ khóa" },
  { value: "ai_flagged", label: "AI gắn cờ" },
  { value: "admin_flagged", label: "Admin gắn cờ" },
  { value: "admin_deleted", label: "Admin xóa" },
  { value: "user_recalled", label: "Người dùng thu hồi" },
] as const;

export interface ModerationTableFilters {
  rowsPerPage: number;
  targetType?: ReportType | "all";
  actionType?: ModerationActionType | "all";
}

interface ModerationTableProps {
  data: ModerationAction[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filters?: ModerationTableFilters;
  onFiltersChange?: (filters: ModerationTableFilters) => void;
}

export function ModerationTable({
  data,
  loading,
  page,
  totalPages,
  onPageChange,
  filters = { rowsPerPage: 10 },
  onFiltersChange,
}: ModerationTableProps) {
  const [selectedAction, setSelectedAction] = React.useState<ModerationAction | null>(null);

  const handleFilterChange = (key: keyof ModerationTableFilters, value: string | number) => {
    if (onFiltersChange) {
      onFiltersChange({ ...filters, [key]: value });
      onPageChange(1); // Reset to first page when filters change
    }
  };

  if (loading) {
    return <div className="w-full h-48 flex items-center justify-center">Đang tải...</div>;
  }

  const getActionBadge = (type: string | null) => {
    switch (type) {
      case "keyword_blocked":
        return <Badge variant="destructive">Chặn</Badge>;
      case "ai_flagged":
        return <Badge className="bg-yellow-500 text-white">AI gắn cờ</Badge>;
      case "admin_deleted":
        return <Badge variant="destructive">Xóa</Badge>;
      case "admin_flagged":
        return <Badge className="bg-orange-500 text-white">Admin gắn cờ</Badge>;
      case "user_recalled":
        return <Badge variant="secondary">Thu hồi</Badge>;
      default:
        return <Badge variant="secondary">{type ?? "Không rõ"}</Badge>;
    }
  };

  const getTargetTypeBadge = (type: string | null) => {
    switch (type) {
      case "post":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Bài viết</Badge>;
      case "comment":
        return <Badge variant="outline" className="border-green-500 text-green-600">Bình luận</Badge>;
      case "message":
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Tin nhắn</Badge>;
      case "group":
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Nhóm</Badge>;
      default:
        return <Badge variant="outline">{type ?? "Không rõ"}</Badge>;
    }
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
          
          <Select
            value={filters.targetType || "all"}
            onValueChange={(value) => handleFilterChange("targetType", value)}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Target Type" />
            </SelectTrigger>
            <SelectContent>
              {TARGET_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.actionType || "all"}
            onValueChange={(value) => handleFilterChange("actionType", value)}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((a) => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Dòng:</span>
            <Select
              value={String(filters.rowsPerPage)}
              onValueChange={(value) => handleFilterChange("rowsPerPage", Number(value))}
            >
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
                <TableHead>Thời gian</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Chi tiết</TableHead>
                <TableHead className="w-[80px]">Xem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    Không tìm thấy hành động kiểm duyệt nào.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedAction(item)}
                  >
                    <TableCell className="whitespace-nowrap">
                      {item.created_at ? format(new Date(item.created_at), "MMM d, HH:mm") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getTargetTypeBadge(item.target_type)}
                        <span className="text-xs text-muted-foreground font-mono">
                          {item.target_id?.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(item.action_type)}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={item.reason ?? ""}>
                      {item.reason ?? "-"}
                    </TableCell>
                    <TableCell>
                      {item.matched_keyword && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Kw: {item.matched_keyword}
                        </span>
                      )}
                      {item.ai_score !== null && item.ai_score !== undefined && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                          AI: {(item.ai_score * 100).toFixed(0)}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAction(item);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
              onClick={() => onPageChange(1)}
              disabled={page <= 1}
            >
              Đầu
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
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
                  onClick={() => onPageChange(pageNum as number)}
                >
                  {pageNum}
                </Button>
              )
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages}
            >
              Cuối
            </Button>
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <ModerationDetailDialog
        action={selectedAction}
        open={!!selectedAction}
        onOpenChange={(open) => !open && setSelectedAction(null)}
      />
    </>
  );
}

interface ModerationDetailDialogProps {
  action: ModerationAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ModerationDetailDialog({ action, open, onOpenChange }: ModerationDetailDialogProps) {
  if (!action) return null;

  const getActionBadge = (type: string | null) => {
    switch (type) {
      case "keyword_blocked":
        return <Badge variant="destructive">Keyword Blocked</Badge>;
      case "ai_flagged":
        return <Badge className="bg-yellow-500 text-white">AI Flagged</Badge>;
      case "admin_deleted":
        return <Badge variant="destructive">Admin Deleted</Badge>;
      case "admin_flagged":
        return <Badge className="bg-orange-500 text-white">Admin Flagged</Badge>;
      case "user_recalled":
        return <Badge variant="secondary">User Recalled</Badge>;
      default:
        return <Badge variant="secondary">{type ?? "Unknown"}</Badge>;
    }
  };

  const getTargetUrl = (type: string | null, id: string | null) => {
    if (!id) return null;
    switch (type) {
      case "post":
        return `/dashboard/posts/all?search=${id}`;
      case "comment":
        return `/dashboard/comments/manage?search=${id}`;
      default:
        return null;
    }
  };

  const targetUrl = getTargetUrl(action.target_type, action.target_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Moderation Action Details
            {getActionBadge(action.action_type)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Target Info */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-semibold text-sm">Target Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Type:</div>
              <div className="capitalize font-medium">{action.target_type}</div>
              <div className="text-muted-foreground">ID:</div>
              <div className="font-mono text-xs break-all">{action.target_id}</div>
            </div>
            {targetUrl && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={targetUrl}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Target
                </a>
              </Button>
            )}
          </div>

          {/* Reason */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-semibold text-sm">Reason</h4>
            <p className="text-sm whitespace-pre-wrap">{action.reason || "Không có lý do"}</p>
          </div>

          {/* Additional Details */}
          {(action.matched_keyword || action.ai_score !== null) && (
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-semibold text-sm">Detection Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {action.matched_keyword && (
                  <>
                    <div className="text-muted-foreground">Matched Keyword:</div>
                    <div>
                      <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">
                        {action.matched_keyword}
                      </span>
                    </div>
                  </>
                )}
                {action.ai_score !== null && action.ai_score !== undefined && (
                  <>
                    <div className="text-muted-foreground">AI Confidence:</div>
                    <div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                        {(action.ai_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-semibold text-sm">Metadata</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Created At:</div>
              <div>
                {action.created_at
                  ? format(new Date(action.created_at), "PPpp")
                  : "-"}
              </div>
              <div className="text-muted-foreground">Created By:</div>
              <div className="font-mono text-xs">
                {action.created_by ? action.created_by.slice(0, 8) + "..." : "System"}
              </div>
              <div className="text-muted-foreground">Action ID:</div>
              <div className="font-mono text-xs break-all">{action.id}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
