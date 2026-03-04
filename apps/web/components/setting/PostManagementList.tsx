"use client";

import { Badge } from "@repo/ui/components/badge";
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
import { Textarea } from "@repo/ui/components/textarea";
import {
  AlertCircle,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { toast } from "sonner";

import { ManagementPost, PostResponse } from "@repo/shared/types/post";

import {
  getQueuePendingPostsForUser,
  getUserPostsManagement,
  submitPostAppealAction,
} from "@/app/actions/post_management";
import { Separator } from "@repo/ui/components/separator";
import { useGetCurrentUser } from "@/hooks/useAuth";
import PostCard from "@/components/posts/PostCard";

type FilterType = "all" | "approved" | "pending" | "rejected";

const FILTER_CONFIG: Record<
  FilterType,
  { label: string; badgeClass: string; activeBadgeClass: string }
> = {
  all: {
    label: "Tất cả",
    badgeClass:
      "border-border text-muted-foreground hover:bg-muted cursor-pointer",
    activeBadgeClass:
      "bg-foreground text-background border-foreground cursor-pointer",
  },
  approved: {
    label: "Công khai",
    badgeClass:
      "border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-500/10 cursor-pointer",
    activeBadgeClass: "bg-green-600 text-white border-green-600 cursor-pointer",
  },
  pending: {
    label: "Chờ duyệt",
    badgeClass:
      "border-yellow-500/40 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/10 cursor-pointer",
    activeBadgeClass:
      "bg-yellow-500 text-white border-yellow-500 cursor-pointer",
  },

  rejected: {
    label: "Từ chối",
    badgeClass:
      "border-red-500/40 text-red-700 dark:text-red-400 hover:bg-red-500/10 cursor-pointer",
    activeBadgeClass: "bg-red-600 text-white border-red-600 cursor-pointer",
  },
};

function StatusBadge({ post }: { post: ManagementPost }) {
  if (post.is_queue_item) {
    const isProcessing = post.queue_status === "processing";
    const isFailed = post.queue_status === "failed";
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant="outline"
          className={
            isFailed
              ? "text-red-600 bg-red-500/10 border-red-500/20"
              : "text-blue-600 bg-blue-500/10 border-blue-500/20"
          }
        >
          {isFailed ? (
            <>
              <X className="w-3 h-3 mr-1" />
              Đăng thất bại
            </>
          ) : (
            <>
              {isProcessing ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              {isProcessing ? "Đang xử lý" : "Đang chờ xử lý"}
            </>
          )}
        </Badge>
        {(post.media_count ?? 0) > 0 && (
          <span className="text-xs text-muted-foreground">
            {post.media_count} file đính kèm
          </span>
        )}
      </div>
    );
  }

  const status = post.moderation_status || "approved";
  if (status === "pending") {
    return (
      <Badge
        variant="outline"
        className="text-yellow-600 bg-yellow-500/10 border-yellow-500/20"
      >
        <Clock className="w-3 h-3 mr-1" />
        Đang chờ hệ thống duyệt
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge
        variant="outline"
        className="text-red-600 bg-red-500/10 border-red-500/20"
      >
        <X className="w-3 h-3 mr-1" />
        Bị từ chối xuất bản
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-green-600 bg-green-500/10 border-green-500/20"
    >
      Đã công khai
    </Badge>
  );
}

export function PostManagementList() {
  const [posts, setPosts] = useState<ManagementPost[]>([]);
  const [queuePosts, setQueuePosts] = useState<ManagementPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appeal, setAppeal] = useState<{ postId: string } | null>(null);
  const [appealReason, setAppealReason] = useState("");
  const [isAppealing, setIsAppealing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const { data: currentUser } = useGetCurrentUser();

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [postsData, queueData] = await Promise.all([
        getUserPostsManagement(),
        getQueuePendingPostsForUser(),
      ]);
      setPosts(postsData);
      setQueuePosts(queueData);
    } catch (error) {
      toast.error("Không thể tải bài viết", {
        description: "Vui lòng thử lại sau",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Combine posts + queue posts, deduplicate by id
  const allPosts = useMemo(() => {
    const combined = [...queuePosts, ...posts];
    const seen = new Set<string>();
    return combined.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [posts, queuePosts]);

  // Counts per filter
  const counts = useMemo(() => {
    return {
      all: allPosts.length,
      approved: allPosts.filter(
        (p) =>
          !p.is_queue_item &&
          (p.moderation_status === "approved" || !p.moderation_status),
      ).length,
      pending: allPosts.filter(
        (p) =>
          p.is_queue_item ||
          (!p.is_queue_item && p.moderation_status === "pending"),
      ).length,
      rejected: allPosts.filter(
        (p) => !p.is_queue_item && p.moderation_status === "rejected",
      ).length,
    };
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    let result = allPosts;

    // Filter by status
    if (filter === "approved") {
      result = result.filter(
        (p) =>
          !p.is_queue_item &&
          (p.moderation_status === "approved" || !p.moderation_status),
      );
    } else if (filter === "pending") {
      result = result.filter(
        (p) =>
          p.is_queue_item ||
          (!p.is_queue_item && p.moderation_status === "pending"),
      );
    } else if (filter === "rejected") {
      result = result.filter(
        (p) => !p.is_queue_item && p.moderation_status === "rejected",
      );
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        (p.content || "").toLowerCase().includes(q),
      );
    }

    return result;
  }, [allPosts, filter, search]);

  const handleAppealSubmit = async () => {
    if (!appeal?.postId || !appealReason.trim()) return;
    setIsAppealing(true);
    try {
      await submitPostAppealAction(appeal.postId, appealReason);
      toast.success(
        "Kháng cáo đã được gửi thành công. Vui lòng chờ quản trị viên xử lý.",
      );
      setAppeal(null);
      setAppealReason("");
      fetchPosts();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi gửi kháng cáo",
      );
    } finally {
      setIsAppealing(false);
    }
  };
  const PostItem = useCallback(
    (_index: number, post: ManagementPost) => {
      const status = post.is_queue_item
        ? post.queue_status
        : post.moderation_status || "approved";
      const postAppeal = post.post_appeals?.[0];

      const formattedPost: PostResponse = {
        id: post.id,
        content: post.content,
        created_at: post.created_at ?? "",
        updated_at: null,
        privacy_level: post.privacy_level ?? "public",
        media_urls: post.post_media?.map((m) => m.media_url) ?? null,
        author: {
          id: currentUser?.id || "",
          username: currentUser?.username || "",
          display_name: currentUser?.display_name || "",
          avatar_url: currentUser?.avatar_url || null,
          global_role:
            currentUser?.global_role === "banned"
              ? "student"
              : currentUser?.global_role || "student",
          slug: currentUser?.slug || "",
        },
        is_liked_by_viewer: false,
        like_count: 0,
        comment_count: 0,
        share_count: 0,
      };

      return (
        <div className="pb-6">
          <div className="flex justify-between items-center mb-2 px-1">
            <StatusBadge post={post} />
          </div>
          {/* Error overlay for failed queue items */}
          {post.is_queue_item &&
            post.queue_status === "failed" &&
            post.error_message && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600">
                <p className="font-semibold">Lý do đăng bài thất bại:</p>
                <p>{post.error_message}</p>
              </div>
            )}

          {/* Rejected appeal section */}
          {!post.is_queue_item && status === "rejected" && (
            <div className="mt-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-start gap-3 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">
                    Bài viết này đã bị từ chối.
                  </p>
                  <p className="text-xs opacity-80 mt-1">
                    Vi phạm tiêu chuẩn cộng đồng hoặc nội dung không phù hợp.
                  </p>
                  {postAppeal && (
                    <div className="mt-2 text-xs font-medium flex items-center gap-1.5">
                      Trạng thái khiếu nại:
                      {postAppeal.status === "pending" && (
                        <span className="text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded">
                          Đang chờ xử lý
                        </span>
                      )}
                      {postAppeal.status === "reviewed" && (
                        <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                          Đang xem xét
                        </span>
                      )}
                      {postAppeal.status === "resolved" && (
                        <span className="text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                          Đã giải quyết
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {(!postAppeal || postAppeal.status === "resolved") && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setAppeal({ postId: post.id })}
                  className="shrink-0 w-full sm:w-auto"
                >
                  Khiếu nại ngay
                </Button>
              )}
            </div>
          )}
          <div className="relative">
            <PostCard
              post={formattedPost}
              isPendingModeration={
                post.is_queue_item ||
                status === "pending" ||
                status === "rejected"
              }
            />
            <Separator className="my-2" />

            {/* Error overlay for failed queue items */}
            {/* {post.is_queue_item &&
              post.queue_status === "failed" &&
              post.error_message && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600">
                  <p className="font-semibold">Lý do đăng bài thất bại:</p>
                  <p>{post.error_message}</p>
                </div>
              )} */}

            {/* Rejected appeal section */}
            {/* {!post.is_queue_item && status === "rejected" && (
              <div className="mt-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-start gap-3 text-red-700 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">
                      Bài viết này đã bị từ chối.
                    </p>
                    <p className="text-xs opacity-80 mt-1">
                      Vi phạm tiêu chuẩn cộng đồng hoặc nội dung không phù hợp.
                    </p>
                    {postAppeal && (
                      <div className="mt-2 text-xs font-medium flex items-center gap-1.5">
                        Trạng thái khiếu nại:
                        {postAppeal.status === "pending" && (
                          <span className="text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded">
                            Đang chờ xử lý
                          </span>
                        )}
                        {postAppeal.status === "reviewed" && (
                          <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                            Đang xem xét
                          </span>
                        )}
                        {postAppeal.status === "resolved" && (
                          <span className="text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                            Đã giải quyết
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {(!postAppeal || postAppeal.status === "resolved") && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setAppeal({ postId: post.id })}
                    className="shrink-0 w-full sm:w-auto"
                  >
                    Khiếu nại ngay
                  </Button>
                )}
              </div>
            )} */}
          </div>
        </div>
      );
    },
    [setAppeal, currentUser],
  );

  return (
    <div className="flex flex-col w-full px-4 md:px-8 pt-6">
      {/* Filter badges + Search row */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Badge filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {(Object.keys(FILTER_CONFIG) as FilterType[]).map((key) => {
            const cfg = FILTER_CONFIG[key];
            const isActive = filter === key;
            const count = counts[key];
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-colors select-none ${
                  isActive ? cfg.activeBadgeClass : cfg.badgeClass
                }`}
              >
                {cfg.label}
                {count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0 rounded-full font-semibold ${
                      isActive
                        ? "bg-white/20 text-inherit"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPosts}
            disabled={isLoading}
            className="ml-auto shrink-0"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm kiếm bài viết..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed border-dashboard-border rounded-xl">
          <FileText className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
          <p className="text-base font-medium">
            {search
              ? `Không tìm thấy bài viết nào cho "${search}"`
              : "Bạn chưa có bài viết nào trong mục này"}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-sm text-mainred hover:underline"
            >
              Xoá tìm kiếm
            </button>
          )}
        </div>
      ) : (
        <Virtuoso
          useWindowScroll
          data={filteredPosts}
          overscan={300}
          itemContent={PostItem}
          components={{
            Footer: () => (
              <p className="text-center text-sm text-muted-foreground py-6">
                Đã hiển thị tất cả {filteredPosts.length} bài viết
              </p>
            ),
          }}
        />
      )}

      {/* Appeal Dialog */}
      <Dialog open={!!appeal} onOpenChange={(open) => !open && setAppeal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Khiếu nại bài viết</DialogTitle>
            <DialogDescription>
              Vui lòng cho quản trị viên biết lý do vì sao bài viết của bạn
              không vi phạm chính sách và nên được khôi phục.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Nhập lý do khiếu nại của bạn chi tiết tại đây..."
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              className="col-span-3 min-h-24"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAppeal(null)}
              disabled={isAppealing}
            >
              Hủy
            </Button>
            <Button
              onClick={handleAppealSubmit}
              disabled={!appealReason.trim() || isAppealing}
              className="bg-mainred hover:bg-mainred-hover text-white"
            >
              {isAppealing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                "Gửi phiếu"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
