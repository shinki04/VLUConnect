"use client";

import { Tables } from "@repo/shared/types/database.types";
import type { ConversationWithDetails } from "@repo/shared/types/messaging";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import {
  Loader2,
  LogOut,
  MessageCircle,
  MoreVertical,
  Users,
} from "lucide-react";
import { useCallback,useEffect, useRef } from "react";

import { useConversationFriendship } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";

import { MessageBubble, MessageDateSeparator } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { NotFriendsBanner } from "./NotFriendsBanner";

interface ChatWindowProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
  currentUser?: Tables<"profiles">;
  onLeave?: () => void;
  onAddFriend?: (userId: string) => void;
  className?: string;
}

/**
 * Main chat window with message list, input, and header
 * Supports realtime updates, optimistic UI, and infinite scroll
 */
export function ChatWindow({
  conversation,
  currentUserId,
  currentUser,
  onLeave,
  onAddFriend,
  className,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    retryMessage,
    loadMore,
    hasMore,
    isLoadingMore,
  } = useMessages({
    conversationId: conversation.id,
    currentUserId,
    currentUser,
    enabled: !!conversation.id,
  });

  // Check friendship status for direct chats
  const { data: friendshipData } = useConversationFriendship(conversation.id);

  // Get display info for header
  const isGroup = conversation.type === "group";
  const getHeaderInfo = () => {
    if (isGroup) {
      return {
        name: conversation.name || "Nhóm chat",
        avatarUrl: conversation.avatar_url,
        subtitle: `${conversation.members?.length || 0} thành viên`,
      };
    }

    const otherMember = conversation.members?.find(
      (m) => m.user_id !== currentUserId
    );
    const profile = otherMember?.profile as Tables<"profiles"> | undefined;

    return {
      name: profile?.display_name || profile?.username || "Người dùng",
      avatarUrl: profile?.avatar_url,
      subtitle: "Đang hoạt động", // Future: online status
    };
  };

  const headerInfo = getHeaderInfo();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Handle scroll for loading more (infinite scroll)
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingMore || !hasMore) return;

    // Load more when scrolled near top
    if (container.scrollTop < 100) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups, message) => {
      const date = message.created_at
        ? new Date(message.created_at).toDateString()
        : "Unknown";

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {} as Record<string, typeof messages>
  );

  const handleAddFriend = () => {
    if (friendshipData?.otherUser && onAddFriend) {
      onAddFriend(friendshipData.otherUser.id);
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-full bg-background", className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {headerInfo.avatarUrl ? (
                <AvatarImage src={headerInfo.avatarUrl} alt={headerInfo.name} />
              ) : null}
              <AvatarFallback>
                {isGroup ? (
                  <Users className="h-5 w-5" />
                ) : (
                  headerInfo.name.substring(0, 2).toUpperCase()
                )}
              </AvatarFallback>
            </Avatar>

            <div>
              <h3 className="font-medium leading-tight">{headerInfo.name}</h3>
              <p className="text-xs text-muted-foreground">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Future: Video/Voice call buttons */}
            {/* <Button size="icon" variant="ghost" className="h-9 w-9">
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-9 w-9">
              <Video className="h-4 w-4" />
            </Button> */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isGroup && onLeave && (
                  <DropdownMenuItem
                    onClick={onLeave}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Rời nhóm
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Not friends banner for direct chats */}
        {!isGroup &&
          friendshipData &&
          !friendshipData.isFriends &&
          friendshipData.otherUser && (
            <NotFriendsBanner
              otherUser={friendshipData.otherUser}
              onAddFriend={handleAddFriend}
            />
          )}

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {isLoading ? (
            <ChatWindowSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-destructive mb-2">Không thể tải tin nhắn</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          ) : messages.length === 0 ? (
            <ChatWindowEmpty isGroup={isGroup} />
          ) : (
            <>
              {/* Load more indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Messages grouped by date */}
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                  <MessageDateSeparator date={date} />
                  <div className="space-y-3">
                    {dateMessages.map((message, index) => {
                      const isOwn = message.sender_id === currentUserId;
                      const prevMessage = dateMessages[index - 1];
                      const showAvatar =
                        !isOwn &&
                        (!prevMessage ||
                          prevMessage.sender_id !== message.sender_id);

                      return (
                        <MessageBubble
                          key={"tempId" in message ? message.tempId : message.id}
                          message={message}
                          isOwn={isOwn}
                          showAvatar={showAvatar}
                          onRetry={retryMessage}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message input */}
        <MessageInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </TooltipProvider>
  );
}

/**
 * Empty state for chat window
 */
function ChatWindowEmpty({ isGroup }: { isGroup: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-1">Chưa có tin nhắn</h3>
      <p className="text-sm text-muted-foreground max-w-[200px]">
        {isGroup
          ? "Gửi tin nhắn đầu tiên cho nhóm"
          : "Gửi tin nhắn để bắt đầu cuộc trò chuyện"}
      </p>
    </div>
  );
}

/**
 * Loading skeleton for chat window
 */
function ChatWindowSkeleton() {
  return (
    <div className="space-y-4 py-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn("flex items-end gap-2", i % 2 === 0 ? "" : "flex-row-reverse")}
        >
          {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
          <Skeleton
            className={cn(
              "h-12 rounded-2xl",
              i % 2 === 0 ? "w-48 rounded-bl-md" : "w-64 rounded-br-md"
            )}
          />
        </div>
      ))}
    </div>
  );
}
