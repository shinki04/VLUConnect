"use client";

import AlertDialog from "@repo/ui/components/AlertDialog";
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
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Flag,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Search,
  Trash2,
  Video,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { approvePost,deletePostAdmin, flagPost, getAllPosts, rejectPost } from "@/app/actions/admin-posts";
import { useRefresh } from "@/components/common/RefreshContext";
import { FlagDialog } from "@/components/FlagDialog";
import { RejectDialog } from "@/components/RejectDialog";
import { getFileInfo, isDocumentType, isImageType, isVideoType } from "@/lib/mediaUtils";

import { ModerationStatus } from "@repo/shared/types/post";

import { PostDetailDialog } from "./PostDetailDialog";

interface PostAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  global_role: string | null;
}

interface Post {
  id: string;
  content: string;
  created_at: string | null;
  author_id: string;
  like_count: number | null;
  comment_count: number | null;
  moderation_status: ModerationStatus | null;
  flag_reason: string | null;
  media_urls?: string[] | null;
  author?: PostAuthor;
}

interface PostsDataTableProps {
  flaggedOnly?: boolean;
  rejectedOnly?: boolean;
  initialData?: {
    posts: Post[];
    totalPages: number;
    total: number;
  };
}

const ROWS_PER_PAGE_OPTIONS = [5, 10, 15, 20, 50] as const;

// Truncate helper
function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

// Format date helper
function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function PostsDataTable({ flaggedOnly = false, rejectedOnly = false, initialData }: PostsDataTableProps) {
  const searchParams = useSearchParams();
  const [posts, setPosts] = React.useState<Post[]>(initialData?.posts as Post[] ?? []);
  const [loading, setLoading] = React.useState(!initialData);
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | ModerationStatus
  >("all");
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(15);
  const [totalPages, setTotalPages] = React.useState(
    initialData?.totalPages ?? 1,
  );
  const [totalCount, setTotalCount] = React.useState(initialData?.total ?? 0);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  // Dialog states
  const [selectedPost, setSelectedPost] = React.useState<Post | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showFlagDialog, setShowFlagDialog] = React.useState(false);
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [postToAction, setPostToAction] = React.useState<Post | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const { refreshKey } = useRefresh();

  const fetchPosts = React.useCallback(async () => {
    setLoading(true);
    try {
      // Determine moderation status filter
      let moderationStatus: ModerationStatus | undefined;
      if (flaggedOnly) moderationStatus = "flagged";
      else if (rejectedOnly) moderationStatus = "rejected";
      else if (statusFilter !== "all") moderationStatus = statusFilter;

      const result = await getAllPosts(page, rowsPerPage, {
        search: search || undefined,
        moderationStatus,
      });
      setPosts(result.posts as unknown as Post[]);
      setTotalPages(result.totalPages);
      setTotalCount(result.total);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, flaggedOnly, rejectedOnly, statusFilter]);

  React.useEffect(() => {
    if (isInitialLoad && initialData) {
      setIsInitialLoad(false);
      return;
    }

    const timer = setTimeout(
      () => {
        fetchPosts();
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [
    fetchPosts,
    search,
    statusFilter,
    refreshKey,
    isInitialLoad,
    initialData,
  ]);

  const handleDelete = async () => {
    if (!postToAction) return;
    setActionLoading(true);
    try {
      await deletePostAdmin(postToAction.id);
      setPosts((prev) => prev.filter((p) => p.id !== postToAction.id));
      if (selectedPost?.id === postToAction.id) setSelectedPost(null);
      setShowDeleteDialog(false);
      setPostToAction(null);
    } catch (error) {
      console.error("Failed to delete post:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlag = async (reason: string) => {
    if (!postToAction) return;
    setActionLoading(true);
    try {
      await flagPost(postToAction.id, reason);
      // Update local state
      const updatePost = (p: Post) =>
        p.id === postToAction.id
          ? {
              ...p,
              moderation_status: "flagged" as ModerationStatus,
              flag_reason: reason,
            }
          : p;

      if (flaggedOnly || rejectedOnly) {
        // Remove from list if we're in a filtered view
        setPosts((prev) => prev.filter((p) => p.id !== postToAction.id));
      } else {
        setPosts((prev) => prev.map(updatePost));
      }
      if (selectedPost?.id === postToAction.id) {
        setSelectedPost({
          ...selectedPost,
          moderation_status: "flagged",
          flag_reason: reason,
        });
      }
      setShowFlagDialog(false);
      setPostToAction(null);
    } catch (error) {
      console.error("Failed to flag post:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!postToAction) return;
    setActionLoading(true);
    try {
      await rejectPost(postToAction.id, reason);
      const updatePost = (p: Post) =>
        p.id === postToAction.id
          ? {
              ...p,
              moderation_status: "rejected" as ModerationStatus,
              flag_reason: reason || null,
            }
          : p;

      if (flaggedOnly) {
        // Remove from flagged list since it's now rejected
        setPosts((prev) => prev.filter((p) => p.id !== postToAction.id));
      } else if (!rejectedOnly) {
        setPosts((prev) => prev.map(updatePost));
      }
      if (selectedPost?.id === postToAction.id) {
        setSelectedPost({
          ...selectedPost,
          moderation_status: "rejected",
          flag_reason: reason || null,
        });
      }
      setShowRejectDialog(false);
      setPostToAction(null);
    } catch (error) {
      console.error("Failed to reject post:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (post: Post) => {
    try {
      await approvePost(post.id);
      if (flaggedOnly || rejectedOnly) {
        // Remove from filtered list
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
        if (selectedPost?.id === post.id) setSelectedPost(null);
      } else {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  moderation_status: "approved" as ModerationStatus,
                  flag_reason: null,
                }
              : p,
          ),
        );
        if (selectedPost?.id === post.id) {
          setSelectedPost({
            ...selectedPost,
            moderation_status: "approved",
            flag_reason: null,
          });
        }
      }
    } catch (error) {
      console.error("Failed to approve post:", error);
    }
  };

  const openDeleteDialog = (post: Post) => {
    setPostToAction(post);
    setShowDeleteDialog(true);
  };

  const openFlagDialog = (post: Post) => {
    setPostToAction(post);
    setShowFlagDialog(true);
  };

  const openRejectDialog = (post: Post) => {
    setPostToAction(post);
    setShowRejectDialog(true);
  };

  const getAuthorName = (post: Post) => {
    if (post.author?.display_name) return post.author.display_name;
    if (post.author?.username) return `@${post.author.username}`;
    return post.author_id?.slice(0, 8) + "...";
  };

  const getAuthorInitials = (post: Post) => {
    const name = post.author?.display_name || post.author?.username || "U";
    return name.slice(0, 2).toUpperCase();
  };

  const getMediaCounts = (post: Post) => {
    if (!post.media_urls || post.media_urls.length === 0) {
      return { images: 0, videos: 0, files: 0, total: 0 };
    }
    let images = 0,
      videos = 0,
      files = 0;
    for (const url of post.media_urls) {
      const info = getFileInfo(url);
      if (isImageType(info.type)) images++;
      else if (isVideoType(info.type)) videos++;
      else if (isDocumentType(info.type)) files++;
    }
    return { images, videos, files, total: post.media_urls.length };
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value));
    setPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      ) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const renderStatusBadge = (post: Post) => {
    const status = post.moderation_status || "approved";
    switch (status) {
      case "rejected":
        return (
          <Badge variant="destructive" className="text-xs">
            Từ chối
          </Badge>
        );
      case "flagged":
        return (
          <Badge
            variant="outline"
            className="text-xs border-orange-500 text-orange-500"
          >
            Gắn cờ
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            Hoạt động
          </Badge>
        );
    }
  };

  const getEmptyMessage = () => {
    if (flaggedOnly) return "Không tìm thấy bài viết bị gắn cờ";
    if (rejectedOnly) return "Không tìm thấy bài viết bị từ chối";
    return "Không tìm thấy bài viết";
  };

  return (
    <>
      <div className="space-y-4">
        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto flex-1 gap-y-2">
            <div className="relative flex-1 max-w-sm min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm bài viết theo nội dung..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            {!flaggedOnly && !rejectedOnly && (
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as "all" | ModerationStatus);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="flagged">Bị gắn cờ</SelectItem>
                  <SelectItem value="rejected">Bị từ chối</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Badge variant="outline" className="h-9 px-3 whitespace-nowrap">
              {loading ? "..." : `${totalCount} bài viết`}
            </Badge>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Dòng:
            </span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={handleRowsPerPageChange}
            >
              <SelectTrigger className="w-[70px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">Tác giả</TableHead>
                <TableHead className="max-w-[300px]">Nội dung</TableHead>
                <TableHead className="w-[100px] text-center">Media</TableHead>
                <TableHead className="w-[100px] text-center">
                  Tương tác
                </TableHead>
                <TableHead className="w-[100px]">Trạng thái</TableHead>
                <TableHead className="w-[140px]">Ngày tạo</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: Math.min(rowsPerPage, 5) }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {getEmptyMessage()}
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => {
                  const mediaCounts = getMediaCounts(post);
                  const status = post.moderation_status || "approved";
                  return (
                    <TableRow
                      key={post.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedPost(post)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={post.author?.avatar_url || undefined}
                            />
                            <AvatarFallback className="text-xs">
                              {getAuthorInitials(post)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {getAuthorName(post)}
                            </p>
                            {post.author?.username &&
                              post.author.display_name && (
                                <p className="text-xs text-muted-foreground truncate">
                                  @{post.author.username}
                                </p>
                              )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="text-sm text-foreground line-clamp-2">
                          {truncateText(post.content, 80)}
                        </p>
                        {post.flag_reason &&
                          (status === "flagged" || status === "rejected") && (
                            <p
                              className={`text-xs mt-1 flex items-center gap-1 ${status === "rejected" ? "text-destructive" : "text-orange-500"}`}
                            >
                              {status === "rejected" ? (
                                <XCircle className="h-3 w-3" />
                              ) : (
                                <Flag className="h-3 w-3" />
                              )}
                              {truncateText(post.flag_reason, 40)}
                            </p>
                          )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                          {mediaCounts.total > 0 ? (
                            <>
                              {mediaCounts.images > 0 && (
                                <span
                                  className="flex items-center gap-0.5 text-xs"
                                  title="Images"
                                >
                                  <ImageIcon className="h-3.5 w-3.5" />
                                  {mediaCounts.images}
                                </span>
                              )}
                              {mediaCounts.videos > 0 && (
                                <span
                                  className="flex items-center gap-0.5 text-xs"
                                  title="Videos"
                                >
                                  <Video className="h-3.5 w-3.5" />
                                  {mediaCounts.videos}
                                </span>
                              )}
                              {mediaCounts.files > 0 && (
                                <span
                                  className="flex items-center gap-0.5 text-xs"
                                  title="Files"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  {mediaCounts.files}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-3 text-muted-foreground">
                          <span className="flex items-center gap-1 text-xs">
                            <Heart className="h-3.5 w-3.5 text-red-400" />
                            {post.like_count ?? 0}
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
                            {post.comment_count ?? 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{renderStatusBadge(post)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(post.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPost(post);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              Đặt trạng thái
                            </DropdownMenuLabel>
                            {status !== "approved" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(post);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                Phê duyệt
                              </DropdownMenuItem>
                            )}
                            {status !== "flagged" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openFlagDialog(post);
                                }}
                              >
                                <Flag className="h-4 w-4 mr-2 text-orange-500" />
                                Gắn cờ để xem xét
                              </DropdownMenuItem>
                            )}
                            {status !== "rejected" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRejectDialog(post);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2 text-destructive" />
                                Từ chối
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(post);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa bài viết
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Trang {page} / {totalPages} ({totalCount} tổng)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPageNumbers().map((pageNum, idx) =>
              pageNum === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-muted-foreground"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(pageNum)}
                  disabled={loading}
                >
                  {pageNum}
                </Button>
              ),
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Post Detail Dialog */}
      <PostDetailDialog
        post={selectedPost}
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPost(null)}
        onFlag={(post) => {
          setSelectedPost(null);
          openFlagDialog(post);
        }}
        onApprove={handleApprove}
        onReject={(post) => {
          setSelectedPost(null);
          openRejectDialog(post);
        }}
        onDelete={(post) => {
          setSelectedPost(null);
          openDeleteDialog(post);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) setPostToAction(null);
        }}
        title="Xóa bài viết?"
        description="Hành động này sẽ xóa vĩnh viễn bài viết và tất cả dữ liệu liên quan. Không thể hoàn tác."
        confirmText="Xóa bài viết"
        onConfirm={handleDelete}
      />

      {/* Flag Dialog */}
      <FlagDialog
        open={showFlagDialog}
        onOpenChange={(open) => {
          setShowFlagDialog(open);
          if (!open) setPostToAction(null);
        }}
        onConfirm={handleFlag}
        loading={actionLoading}
      />

      {/* Reject Dialog */}
      <RejectDialog
        open={showRejectDialog}
        onOpenChange={(open) => {
          setShowRejectDialog(open);
          if (!open) setPostToAction(null);
        }}
        onConfirm={handleReject}
        loading={actionLoading}
      />
    </>
  );
}
