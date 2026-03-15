"use client";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@repo/ui/components/input-group";
import { cn } from "@repo/ui/lib/utils";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import {
  CheckCheck,
  CopyIcon,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { useState } from "react";

import { usePostInteractions } from "@/hooks/usePostInteractions";

// PostStats Component
interface PostStatsProps {
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

export function PostStats({
  likeCount,
  commentCount,
  shareCount,
}: PostStatsProps) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground py-2">
      <div className="flex gap-1">
        {likeCount > 0 && <span>{likeCount} lượt thích</span>}
      </div>
      <div className="flex gap-3">
        {commentCount > 0 && <span>{commentCount} bình luận</span>}
        {shareCount > 0 && <span>{shareCount} chia sẻ</span>}
      </div>
    </div>
  );
}

// PostActions Component
interface PostActionsProps {
  post: {
    id: string;
    like_count: number;
    comment_count: number;
    share_count: number;
    is_liked_by_viewer: boolean;
  };
  onCommentClick?: () => void;
  className?: string;
  showStats?: boolean; // Option to hide internal stats if displayed externally
}

export function PostActions({
  post,
  onCommentClick,
  className,
  showStats = false,
}: PostActionsProps) {
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const { isLiked, likeCount, toggleLike, share } = usePostInteractions(
    post.id,
    {
      isLiked: post.is_liked_by_viewer,
      count: post.like_count,
    },
  );

  return (
    <>
      <div className={cn("flex flex-col", className)}>
        {showStats && (
          <PostStats
            likeCount={likeCount}
            commentCount={post.comment_count}
            shareCount={post.share_count}
          />
        )}

        <div className="flex items-center justify-between border-t py-1 mt-1">
          <Button
            variant="ghost"
            className="flex-1 gap-1 sm:gap-2 px-1 sm:px-2 hover:bg-muted/50 transition-colors"
            onClick={() => toggleLike()}
          >
            <Heart
              className={cn(
                "w-5 h-5 shrink-0 transition-colors",
                isLiked && "fill-red-500 text-red-500",
              )}
            />
            <span
              className={cn(
                "text-xs sm:text-sm font-medium hidden min-[360px]:inline",
                isLiked && "text-red-500",
              )}
            >
              Thích
            </span>
          </Button>

          <Button
            variant="ghost"
            className="flex-1 gap-1 sm:gap-2 px-1 sm:px-2 hover:bg-muted/50 transition-colors"
            onClick={onCommentClick}
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-medium hidden min-[360px]:inline">
              Bình luận
            </span>
          </Button>

          <Button
            variant="ghost"
            className="flex-1 gap-1 sm:gap-2 px-1 sm:px-2 hover:bg-muted/50 transition-colors"
            onClick={() => setOpenShareDialog(true)}
          >
            <Share2 className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-medium hidden min-[360px]:inline">
              Chia sẻ
            </span>
          </Button>
        </div>
      </div>
      <PostShareDialog
        open={openShareDialog}
        onOpenChange={setOpenShareDialog}
        postId={post.id}
      />
    </>
  );
}

export function PostShareDialog({
  open,
  onOpenChange,
  postId,
}: {
  open?: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}) {
  const [copiedText, copyToClipboard] = useCopyToClipboard();
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/post/${postId}`
      : `/post/${postId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chia sẻ bài viết</DialogTitle>
          <DialogDescription>
            Sao chép liên kết bên dưới để chia sẻ bài viết này
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <InputGroup>
            <InputGroupInput
              value={shareUrl}
              readOnly
              disabled
              className="text-sm"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="Copy"
                title="Copy"
                size="icon-xs"
                onClick={() => {
                  copyToClipboard(shareUrl);
                }}
              >
                {copiedText ? <CheckCheck /> : <CopyIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Đóng</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}