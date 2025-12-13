"use client";

import { Tables } from "@repo/shared/types/database.types";
import type { ConversationWithDetails } from "@repo/shared/types/messaging";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { MessageCircle, Users } from "lucide-react";

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
  isActive?: boolean;
  onClick?: () => void;
}

/**
 * Single conversation item in the list
 * Shows avatar, name, last message preview, and unread count
 */
export function ConversationItem({
  conversation,
  currentUserId,
  isActive = false,
  onClick,
}: ConversationItemProps) {
  const isGroup = conversation.type === "group";

  // Get display name and avatar for conversation
  const getDisplayInfo = () => {
    if (isGroup) {
      return {
        name: conversation.name || "Nhóm chat",
        avatarUrl: conversation.avatar_url,
        initials: (conversation.name || "N").substring(0, 2).toUpperCase(),
      };
    }

    // For direct messages, show the other person
    const otherMember = conversation.members?.find(
      (m) => m.user_id !== currentUserId
    );
    const profile = otherMember?.profile as Tables<"profiles"> | undefined;

    return {
      name: profile?.display_name || profile?.username || "Người dùng",
      avatarUrl: profile?.avatar_url,
      initials: (profile?.display_name || profile?.username || "U")
        .substring(0, 2)
        .toUpperCase(),
    };
  };

  const displayInfo = getDisplayInfo();
  const lastMessage = conversation.lastMessage;
  const unreadCount = conversation.unreadCount || 0;

  // Format last message preview
  const getMessagePreview = () => {
    if (!lastMessage) return "Chưa có tin nhắn";

    const senderName =
      lastMessage.sender_id === currentUserId
        ? "Bạn"
        : (lastMessage.sender as Tables<"profiles">)?.display_name || "Ai đó";

    const content =
      lastMessage.content.length > 30
        ? `${lastMessage.content.substring(0, 30)}...`
        : lastMessage.content;

    if (isGroup) {
      return `${senderName}: ${content}`;
    }
    return lastMessage.sender_id === currentUserId ? `Bạn: ${content}` : content;
  };

  // Format time
  const getTimeAgo = () => {
    if (!lastMessage?.created_at) return "";
    return formatDistanceToNow(new Date(lastMessage.created_at), {
      addSuffix: false,
      locale: vi,
    });
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
        "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
        isActive && "bg-accent",
        unreadCount > 0 && "bg-primary/5"
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12">
          {displayInfo.avatarUrl ? (
            <AvatarImage src={displayInfo.avatarUrl} alt={displayInfo.name} />
          ) : null}
          <AvatarFallback
            className={cn(
              "text-sm font-medium",
              isGroup ? "bg-primary/10 text-primary" : "bg-muted"
            )}
          >
            {isGroup ? <Users className="h-5 w-5" /> : displayInfo.initials}
          </AvatarFallback>
        </Avatar>

        {/* Online indicator (future feature) */}
        {/* <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" /> */}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "font-medium truncate",
              unreadCount > 0 && "text-foreground"
            )}
          >
            {displayInfo.name}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {getTimeAgo()}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              "text-sm truncate",
              unreadCount > 0
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            )}
          >
            {getMessagePreview()}
          </p>

          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="shrink-0 h-5 min-w-[20px] px-1.5 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Empty state for no conversations
 */
export function ConversationListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-1">Chưa có cuộc trò chuyện</h3>
      <p className="text-sm text-muted-foreground max-w-[200px]">
        Bắt đầu trò chuyện với bạn bè hoặc tạo nhóm mới
      </p>
    </div>
  );
}
