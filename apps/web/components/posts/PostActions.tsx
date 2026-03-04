"use client";

import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { Heart, MessageCircle, Share2 } from "lucide-react";

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

export function PostActions({ post, onCommentClick, className, showStats = false }: PostActionsProps) {
  const { isLiked, likeCount, toggleLike, share } = usePostInteractions(post.id, {
    isLiked: post.is_liked_by_viewer,
    count: post.like_count
  });

  return (
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
          onClick={() => share()}
        >
          <Share2 className="w-5 h-5 shrink-0" />
          <span className="text-xs sm:text-sm font-medium hidden min-[360px]:inline">
            Chia sẻ
          </span>
        </Button>
      </div>
    </div>
  );
}
