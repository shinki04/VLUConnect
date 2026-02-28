"use client";

import { Tables } from "@repo/shared/types/database.types";
import type { ConversationWithDetails } from "@repo/shared/types/messaging";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { cn } from "@repo/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCheck, MessageCircle, MoreVertical, Users } from "lucide-react";
import { useState } from "react";

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
  isActive?: boolean;
  onClick?: () => void;
  onMarkAsRead?: (conversationId: string) => void;
}

/**
 * Single conversation item in the list
 * Shows avatar, name, last message preview, and unread count
 * Includes dropdown menu for actions like mark as read
 */
export function ConversationItem({
  conversation,
  currentUserId,
  isActive = false,
  onClick,
  onMarkAsRead,
}: ConversationItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

    const messageContent = lastMessage.content || "";
    const content =
      messageContent.length > 30
        ? `${messageContent.substring(0, 30)}...`
        : messageContent;

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

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(conversation.id);
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={cn(
          "w-full chat-conversation-item",
          isActive && "chat-conversation-item-active",
        )}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12 border-2 border-primary/20 bg-cover bg-center">
            {displayInfo.avatarUrl ? (
              <AvatarImage src={displayInfo.avatarUrl} alt={displayInfo.name} />
            ) : null}
            <AvatarFallback
              className={cn(
                "text-sm font-medium",
                isGroup ? "bg-primary/10 text-primary" : "bg-muted",
              )}
            >
              {isGroup ? <Users className="h-5 w-5" /> : displayInfo.initials}
            </AvatarFallback>
          </Avatar>

          {/* Unread dot indicator */}
          {unreadCount > 0 && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-background-dark animate-pulse" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span
              className={cn(
                "font-semibold truncate",
                unreadCount > 0
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-slate-900 dark:text-slate-100",
              )}
            >
              {displayInfo.name}
            </span>
            <span
              className={cn(
                "text-xs shrink-0",
                unreadCount > 0 ? "text-primary font-medium" : "text-slate-400",
              )}
            >
              {getTimeAgo()}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "text-sm truncate",
                unreadCount > 0
                  ? "text-slate-900 dark:text-slate-100 font-medium"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              {getMessagePreview()}
            </p>

            {unreadCount > 0 && (
              <div className="size-2 bg-primary rounded-full shrink-0 animate-in fade-in-0 zoom-in-95 duration-200" />
            )}
          </div>
        </div>
      </button>

      {/* Dropdown Menu - appears on hover */}
      <div
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
          isMenuOpen && "opacity-100",
        )}
      >
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                "bg-background/80 backdrop-blur-sm hover:bg-accent",
                "border border-border/50 shadow-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
              )}
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {unreadCount > 0 && (
              <DropdownMenuItem
                onClick={handleMarkAsRead}
                className="cursor-pointer"
              >
                <CheckCheck className="h-4 w-4 mr-2 text-green-500" />
                <span>Đánh dấu đã đọc</span>
              </DropdownMenuItem>
            )}
            {unreadCount === 0 && (
              <DropdownMenuItem
                disabled
                className="cursor-not-allowed opacity-50"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                <span>Đã đọc tất cả</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
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
