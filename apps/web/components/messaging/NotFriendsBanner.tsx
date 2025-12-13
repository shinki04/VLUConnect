"use client";

import { Tables } from "@repo/shared/types/database.types";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { UserPlus } from "lucide-react";

interface NotFriendsBannerProps {
  otherUser: Tables<"profiles">;
  onAddFriend?: () => void;
  isAddingFriend?: boolean;
  className?: string;
}

/**
 * Banner shown when chatting with someone who is not a friend
 * Displays info message and optional "Add Friend" button
 */
export function NotFriendsBanner({
  otherUser,
  onAddFriend,
  isAddingFriend = false,
  className,
}: NotFriendsBannerProps) {
  const displayName =
    otherUser.display_name || otherUser.username || "Người dùng này";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-2.5",
        "bg-amber-500/10 border-b border-amber-500/20",
        "text-amber-700 dark:text-amber-400",
        className
      )}
    >
      <p className="text-sm">
        <span className="font-medium">{displayName}</span> và bạn chưa là bạn
        bè. Tin nhắn có thể bị hạn chế.
      </p>

      {onAddFriend && (
        <Button
          size="sm"
          variant="outline"
          onClick={onAddFriend}
          disabled={isAddingFriend}
          className="shrink-0 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          {isAddingFriend ? "Đang gửi..." : "Kết bạn"}
        </Button>
      )}
    </div>
  );
}
