"use client";

import { Button } from "@repo/ui/components/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCircle, Loader2, XCircle, Eye, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";

import { getPendingAppeals, updateAppealStatus } from "@/app/actions/appeals";
import { PostAppeal } from "@repo/shared/types/post";

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<PostAppeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<PostAppeal | null>(null);

  const fetchAppeals = async () => {
    setIsLoading(true);
    try {
      const data = await getPendingAppeals();
      setAppeals(data);
    } catch {
      toast.error("Không thể tải danh sách khiếu nại");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals();
  }, []);

  const handleAction = async (appealId: string, postId: string, action: "approve_post" | "reject_appeal") => {
    try {
      setAppeals((prev) => prev.filter((a) => a.id !== appealId));
      setSelectedAppeal(null);
      await updateAppealStatus(appealId, postId, action);
      toast.success(
        action === "approve_post"
          ? "Đã khôi phục bài viết"
          : "Đã từ chối khiếu nại",
      );
    } catch {
      toast.error("Có lỗi xảy ra");
      fetchAppeals(); // Revert on error
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Kháng cáo bài viết
        </h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : appeals.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border rounded-xl">
          <CheckCircle className="w-12 h-12 mb-4 text-green-500 mx-auto" />
          <p className="text-lg font-medium">
            Không có khiếu nại nào đang chờ xử lý
          </p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableCaption>
              Danh sách các bài viết bị giới hạn đang đợi quản trị viên duyệt
              lại.
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
              {appeals.map((appeal) => (
                <TableRow key={appeal.id}>
                  <TableCell className="font-medium">
                    {appeal.user?.display_name || "Người dùng ẩn danh"}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      @{appeal.user?.username}
                    </span>
                  </TableCell>
                  <TableCell>{appeal.reason}</TableCell>
                  <TableCell className="text-muted-foreground text-xs line-clamp-2">
                    {appeal.post?.content || "Không có nội dung"}
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog
        open={!!selectedAppeal}
        onOpenChange={(open) => !open && setSelectedAppeal(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
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
                <div className="ml-auto text-sm text-muted-foreground">
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
                <div className="p-4 bg-yellow-500/10 text-yellow-800 dark:text-yellow-200 border border-yellow-500/20 rounded-lg whitespace-pre-wrap">
                  {selectedAppeal.reason}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Nội dung bài viết vi phạm
                </h4>
                <div className="p-4 bg-card border rounded-lg space-y-4">
                  <p className="whitespace-pre-wrap">
                    {selectedAppeal.post?.content || "Không có nội dung"}
                  </p>

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
            <Button variant="outline" onClick={() => setSelectedAppeal(null)}>
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
