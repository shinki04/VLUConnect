"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  CheckCircle,
  Download,
  ExternalLink,
  File,
  FileSpreadsheet,
  FileText,
  FileType,
  Flag,
  Heart,
  MessageCircle,
  Trash2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { getFileInfo, getFileName, isDocumentType, isImageType, isVideoType } from "@/lib/mediaUtils";

// Moderation status type matching database enum
type ModerationStatus = "approved" | "rejected" | "flagged";

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

interface PostDetailDialogProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFlag?: (post: Post) => void;
  onApprove?: (post: Post) => void;
  onReject?: (post: Post) => void;
  onDelete?: (post: Post) => void;
}

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

function getAuthorName(post: Post) {
  if (post.author?.display_name) return post.author.display_name;
  if (post.author?.username) return `@${post.author.username}`;
  return post.author_id?.slice(0, 8) + "...";
}

function getAuthorInitials(post: Post) {
  const name = post.author?.display_name || post.author?.username || "U";
  return name.slice(0, 2).toUpperCase();
}

// File icon component based on type
function FileIcon({ type }: { type: string }) {
  switch (type) {
    case "pdf":
      return <FileText className="h-8 w-8 text-red-500" />;
    case "word":
      return <FileType className="h-8 w-8 text-blue-500" />;
    case "excel":
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    default:
      return <File className="h-8 w-8 text-gray-500" />;
  }
}

// Media item component
function MediaItem({ url, index }: { url: string; index: number }) {
  const fileInfo = getFileInfo(url);
  const fileName = getFileName(url);

  if (isImageType(fileInfo.type)) {
    return (
      <div className="relative aspect-square rounded-lg border overflow-hidden bg-muted group">
        <Image
          src={url}
          alt={`Media ${index + 1}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  }

  if (isVideoType(fileInfo.type)) {
    return (
      <div className="relative aspect-video rounded-lg border overflow-hidden bg-muted">
        <video
          src={url}
          className="w-full h-full object-cover"
          controls
          preload="metadata"
        />
      </div>
    );
  }

  // Document/File preview
  if (isDocumentType(fileInfo.type)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
      >
        <FileIcon type={fileInfo.type} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground">{fileInfo.label}</p>
        </div>
        <Download className="h-4 w-4 text-muted-foreground" />
      </a>
    );
  }

  return null;
}

export function PostDetailDialog({
  post,
  open,
  onOpenChange,
  onFlag,
  onApprove,
  onReject,
  onDelete,
}: PostDetailDialogProps) {
  if (!post) return null;

  const status = post.moderation_status || "approved";
  const images = post.media_urls?.filter((url) => isImageType(getFileInfo(url).type)) || [];
  const videos = post.media_urls?.filter((url) => isVideoType(getFileInfo(url).type)) || [];
  const files = post.media_urls?.filter((url) => isDocumentType(getFileInfo(url).type)) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback>{getAuthorInitials(post)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg">{getAuthorName(post)}</p>
              <p className="text-sm font-normal text-muted-foreground">
                {formatDate(post.created_at)}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Post details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Status badges */}
          <div className="flex items-center gap-3 flex-wrap">
            {status === "rejected" ? (
              <Badge variant="destructive">Rejected</Badge>
            ) : status === "flagged" ? (
              <Badge variant="outline" className="border-orange-500 text-orange-500">Flagged</Badge>
            ) : (
              <Badge variant="secondary">Active</Badge>
            )}
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 text-red-400" />
              {post.like_count ?? 0} likes
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4 text-blue-400" />
              {post.comment_count ?? 0} comments
            </span>
          </div>

          {/* Flag/Reject reason */}
          {post.flag_reason && status === "flagged" && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Lý do đánh dấu
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                {post.flag_reason}
              </p>
            </div>
          )}

          {post.flag_reason && status === "rejected" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Lý do từ chối
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {post.flag_reason}
              </p>
            </div>
          )}

          {/* Content */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
          </div>

          {/* Images Gallery */}
          {images.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Ảnh ({images.length})</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((url, i) => (
                  <MediaItem key={`img-${i}`} url={url} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Video ({videos.length})</p>
              <div className="grid gap-3">
                {videos.map((url, i) => (
                  <MediaItem key={`vid-${i}`} url={url} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {files.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Tệp ({files.length})</p>
              <div className="grid gap-2">
                {files.map((url, i) => (
                  <MediaItem key={`file-${i}`} url={url} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t flex-wrap">
            {status !== "approved" && (
              <Button
                variant="outline"
                onClick={() => onApprove?.(post)}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Phê duyệt
              </Button>
            )}
            {status !== "flagged" && (
              <Button
                variant="outline"
                onClick={() => onFlag?.(post)}
                className="flex-1"
              >
                <Flag className="h-4 w-4 mr-2 text-orange-500" />
                Đánh dấu
              </Button>
            )}
            {status !== "rejected" && (
              <Button
                variant="outline"
                onClick={() => onReject?.(post)}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2 text-destructive" />
                Từ chối
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => onDelete?.(post)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
