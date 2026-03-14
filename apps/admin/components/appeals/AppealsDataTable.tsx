"use client";

import { PostAppeal } from "@repo/shared/types/post";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { getPendingAppeals, updateAppealStatus } from "@/app/actions/appeals";

interface AppealsDataTableProps {
  initialData?: {
    appeals: PostAppeal[];
    totalPages: number;
    total: number;
  };
}

const ROWS_PER_PAGE_OPTIONS = [5, 10, 15, 20, 50] as const;

export function AppealsDataTable({ initialData }: AppealsDataTableProps) {
  const [appeals, setAppeals] = React.useState<PostAppeal[]>(
    initialData?.appeals || [],
  );
  const [loading, setLoading] = React.useState(!initialData);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(15);
  const [totalPages, setTotalPages] = React.useState(
    initialData?.totalPages || 1,
  );
  const [totalCount, setTotalCount] = React.useState(initialData?.total || 0);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  const [selectedAppeal, setSelectedAppeal] = React.useState<PostAppeal | null>(
    null,
  );

  const fetchAppeals = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPendingAppeals(page, rowsPerPage, {
        search: search || undefined,
      });
      setAppeals(result.appeals as unknown as PostAppeal[]);
      setTotalPages(result.totalPages);
      setTotalCount(result.total);
    } catch {
      toast.error("Không thể tải danh sách khiếu nại");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  React.useEffect(() => {
    if (isInitialLoad && initialData) {
      setIsInitialLoad(false);
      return;
    }

    const timer = setTimeout(
      () => {
        fetchAppeals();
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [fetchAppeals, search, isInitialLoad, initialData]);

  const handleAction = async (
    appealId: string,
    postId: string,
    action: "approve_post" | "reject_appeal",
  ) => {
    try {
      setAppeals((prev) => prev.filter((a) => a.id !== appealId));
      setSelectedAppeal(null);
      await updateAppealStatus(appealId, postId, action);
      toast.success(
        action === "approve_post"
          ? "Đã khôi phục bài viết"
          : "Đã từ chối khiếu nại",
      );
      fetchAppeals();
    } catch {
      toast.error("Có lỗi xảy ra");
      fetchAppeals(); // Revert on error
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm lý do..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>

        {/* Rows per page */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Số dòng:
          </span>
          <Select
            value={rowsPerPage.toString()}
            onValueChange={(val) => {
              setRowsPerPage(Number(val));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt.toString()}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableCaption className="mb-4">
            Danh sách các bài viết bị giới hạn đang đợi quản trị viên duyệt lại.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Người kháng cáo</TableHead>
              <TableHead className="w-[30%]">Lý do kháng cáo</TableHead>
              <TableHead className="w-[30%]">Nội dung bài viết</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : appeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <CheckCircle className="w-10 h-10 mb-2 text-green-500" />
                    Không có khiếu nại nào
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              appeals.map((appeal) => (
                <TableRow key={appeal.id}>
                  <TableCell className="font-medium">
                    {appeal.user?.display_name || "Người dùng ẩn danh"}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      @{appeal.user?.username}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[30vw]">
                    <div className="line-clamp-2" title={appeal.reason}>
                      {appeal.reason}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[30vw]">
                    <div className="text-muted-foreground text-xs line-clamp-2" title={appeal.post?.content || "Không có nội dung"}>
                      {appeal.post?.content || "Không có nội dung"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(appeal.created_at), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAppeal(appeal)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination control */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Hiển thị {(page - 1) * rowsPerPage + 1} -{" "}
          {Math.min(page * rowsPerPage, totalCount)} trong số {totalCount} khiếu
          nại
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            Trang {page} / {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog
        open={!!selectedAppeal}
        onOpenChange={(open) => !open && setSelectedAppeal(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90%] w-[95vw] md:w-full overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              Chi tiết khiếu nại
            </DialogTitle>
            <DialogDescription>
              Xem xét kỹ lý do khiếu nại và nội dung bài viết trước khi đưa ra
              quyết định.
            </DialogDescription>
          </DialogHeader>

          {selectedAppeal && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedAppeal.user?.avatar_url || ""} />
                    <AvatarFallback>
                      {selectedAppeal.user?.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">
                      {selectedAppeal.user?.display_name || "Người dùng ẩn danh"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      @{selectedAppeal.user?.username}
                    </p>
                  </div>
                </div>
                <div className="sm:ml-auto mt-2 sm:mt-0 text-sm text-muted-foreground">
                  Kháng cáo{" "}
                  {formatDistanceToNow(new Date(selectedAppeal.created_at), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Lý do khiếu nại
                </h4>
                <div className="p-4 bg-yellow-500/10 text-yellow-800 dark:text-yellow-200 border border-yellow-500/20 rounded-lg whitespace-pre-wrap max-h-[30vh] overflow-y-auto custom-scrollbar wrap-break-word">
                  {selectedAppeal.reason}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Nội dung bài viết vi phạm
                </h4>
                <div className="p-4 bg-card border rounded-lg space-y-4">
                  <div className="max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                    <p className="whitespace-pre-wrap wrap-break-word">
                      {selectedAppeal.post?.content || "Không có nội dung"}
                    </p>
                  </div>

                  {selectedAppeal.post?.media_urls &&
                    selectedAppeal.post.media_urls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {selectedAppeal.post.media_urls.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-video bg-muted rounded-md overflow-hidden"
                          >
                            {url.includes("video") ||
                            url.endsWith(".mp4") ||
                            url.endsWith(".webm") ||
                            url.endsWith(".ogg") ? (
                              <video
                                src={url}
                                className="object-cover w-full h-full"
                                controls
                              />
                            ) : (
                              <img
                                src={url}
                                alt="media"
                                className="object-cover w-full h-full"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <Button
              className="mx-2"
              variant="outline"
              onClick={() => setSelectedAppeal(null)}
            >
              Đóng
            </Button>
            <div className="flex flex-1 sm:flex-none gap-2">
              <Button
                variant="destructive"
                onClick={() =>
                  handleAction(
                    selectedAppeal!.id,
                    selectedAppeal!.post_id,
                    "reject_appeal",
                  )
                }
                className="flex-1 sm:flex-none gap-2"
              >
                <XCircle className="w-4 h-4" />
                Từ chối
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none gap-2"
                onClick={() =>
                  handleAction(
                    selectedAppeal!.id,
                    selectedAppeal!.post_id,
                    "approve_post",
                  )
                }
              >
                <CheckCircle className="w-4 h-4" />
                Khôi phục
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
