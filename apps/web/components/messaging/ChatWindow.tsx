"use client";

import { Tables } from "@repo/shared/types/database.types";
import type {
  ConversationWithDetails,
  MessageWithSender,
  OptimisticMessage} from "@repo/shared/types/messaging";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import { Loader2, MessageCircle, Users } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

import { useConversationFriendship } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";

import { ChatDropdownDirect, ChatDropdownGroup } from "./ChatDropdown";
import { GroupSettingsSheet } from "./GroupSettingsSheet";
import { MessageBubble, MessageDateSeparator } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { NotFriendsBanner } from "./NotFriendsBanner";

interface ChatWindowProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
  currentUser?: Tables<"profiles">;
  isInitialLoading?: boolean;
  onLeave?: () => void;
  onAddFriend?: (userId: string) => void;
  className?: string;
}

// Union type for virtualized items
type VirtualizedItem = 
  | { type: "date-separator"; date: string; key: string }
  | { type: "message"; message: MessageWithSender | OptimisticMessage; isOwn: boolean; showAvatar: boolean; key: string };

/**
 * Main chat window with virtualized message list
 * Uses react-virtuoso for efficient rendering of large message lists
 */
export function ChatWindow({
  conversation,
  currentUserId,
  currentUser,
  isInitialLoading = false,
  onLeave,
  onAddFriend,
  className,
}: ChatWindowProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [atBottom, setAtBottom] = useState(true);
  const prevMessagesLengthRef = useRef(0);

  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    content: string | null;
    senderName: string | null;
  } | null>(null);

  // Group settings sheet state
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    retryMessage,
    editMessage,
    recallMessage,
    loadMore,
    hasMore,
    isLoadingMore,
    hasFetchedOnce,
  } = useMessages({
    conversationId: conversation.id,
    currentUserId,
    currentUser,
    enabled: !!conversation.id,
  });

  // Check friendship status for direct chats
  const { data: friendshipData } = useConversationFriendship(conversation.id);

  const isGroup = conversation.type === "group";

  // Memoized header info
  const headerInfo = useMemo(() => {
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
      subtitle: "Đang hoạt động",
    };
  }, [
    isGroup,
    conversation.name,
    conversation.avatar_url,
    conversation.members,
    currentUserId,
  ]);

  // Flatten messages with date separators for virtuoso
  const virtualizedItems = useMemo(() => {
    const items: VirtualizedItem[] = [];
    let lastDate: string | null = null;

    messages.forEach((message, idx) => {
      const date = message.created_at
        ? new Date(message.created_at).toDateString()
        : "Unknown";

      // Add date separator if new date
      if (date !== lastDate) {
        items.push({
          type: "date-separator",
          date,
          key: `date-${date}`,
        });
        lastDate = date;
      }

      // Determine if should show avatar
      const isOwn = message.sender_id === currentUserId;
      const prevMessage = messages[idx - 1];
      const prevDate = prevMessage?.created_at
        ? new Date(prevMessage.created_at).toDateString()
        : null;
      const showAvatar =
        !isOwn &&
        (date !== prevDate || prevMessage?.sender_id !== message.sender_id);

      items.push({
        type: "message",
        message,
        isOwn,
        showAvatar,
        key: "tempId" in message ? message.tempId : message.id,
      });
    });

    return items;
  }, [messages, currentUserId]);

  // Handle load more when scrolling to top
  const handleStartReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  const handleAddFriend = useCallback(() => {
    if (friendshipData?.otherUser && onAddFriend) {
      onAddFriend(friendshipData.otherUser.id);
    }
  }, [friendshipData, onAddFriend]);

  // Reply handlers
  const handleReply = useCallback((message: MessageWithSender | OptimisticMessage) => {
    const sender = message.sender;
    const messageId = "id" in message ? message.id : "";
    if (!messageId) return;
    
    setReplyingTo({
      id: messageId,
      content: message.content || null,
      senderName: sender?.display_name || sender?.username || null,
    });
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Wrapper for sendMessage that scrolls immediately
  const handleSendMessage = useCallback(async (
    content: string,
    replyTo?: { id: string; content: string | null; sender?: { display_name: string | null } },
    files?: File[]
  ) => {
    // Send message first (this adds optimistic message to state)
    const sendPromise = sendMessage(content, replyTo, files);
    
    // Force scroll to bottom after a small delay to ensure optimistic message is rendered
    // Use multiple timeouts to handle both immediate add and file upload states
    setTimeout(() => {
      virtuosoRef.current?.scrollToIndex({
        index: "LAST",
        behavior: "smooth",
        align: "end",
      });
    }, 50);
    
    // Second scroll after 200ms to handle any state updates from file processing
    setTimeout(() => {
      virtuosoRef.current?.scrollToIndex({
        index: "LAST", 
        behavior: "smooth",
        align: "end",
      });
    }, 200);
    
    return sendPromise;
  }, [sendMessage]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({
      index: virtualizedItems.length - 1,
      behavior: "smooth",
    });
  }, [virtualizedItems.length]);

  // Reset scroll position when conversation changes
  useEffect(() => {
    if (hasFetchedOnce && virtualizedItems.length > 0) {
      virtuosoRef.current?.scrollToIndex({
        index: virtualizedItems.length - 1,
        behavior: "auto",
      });
    }
  }, [conversation.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const currentLength = messages.length;
    const prevLength = prevMessagesLengthRef.current;

    // Only auto-scroll if:
    // 1. New messages were added (not removed via load more at top)
    // 2. User is at bottom OR the new message is from the current user
    if (currentLength > prevLength && prevLength > 0) {
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage?.sender_id === currentUserId;
      
      // Always scroll if user sent the message, or if they're already at bottom
      if (isOwnMessage || atBottom) {
        // Use setTimeout to ensure DOM has updated with new message
        setTimeout(() => {
          virtuosoRef.current?.scrollToIndex({
            index: virtualizedItems.length - 1,
            behavior: "smooth",
          });
        }, 50);
      }
    }

    prevMessagesLengthRef.current = currentLength;
  }, [messages, currentUserId, atBottom, virtualizedItems.length]);

  // Render individual virtualized item
  const itemContent = useCallback(
    (index: number, item: VirtualizedItem) => {
      if (item.type === "date-separator") {
        return (
          <div className="px-4">
            <MessageDateSeparator date={item.date} />
          </div>
        );
      }

      return (
        <div className="py-1.5 px-4">
          <MessageBubble
            message={item.message}
            isOwn={item.isOwn}
            showAvatar={item.showAvatar}
            onRetry={retryMessage}
            onEditMessage={editMessage}
            onRecallMessage={recallMessage}
            onReply={handleReply}
          />
        </div>
      );
    },
    [retryMessage, editMessage, recallMessage, handleReply]
  );

  // Header component for loading indicator
  const Header = useMemo(() => {
    if (!isLoadingMore) return null;
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }, [isLoadingMore]);

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
            {isGroup ? (
              <ChatDropdownGroup
                onLeave={onLeave}
                onOpenSettings={() => setShowGroupSettings(true)}
              />
            ) : (
              <ChatDropdownDirect userId={friendshipData?.otherUser?.id} />
            )}
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

        {/* Virtualized Messages Area */}
        <div className="flex-1 relative overflow-hidden overflow-x-hidden">
          {isInitialLoading || isLoading || !hasFetchedOnce ? (
            <div className="absolute inset-0 overflow-y-auto px-4 py-4">
              <ChatWindowSkeleton />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-destructive mb-2">Không thể tải tin nhắn</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          ) : messages.length === 0 ? (
            <ChatWindowEmpty isGroup={isGroup} />
          ) : (
            <>
              <Virtuoso
                ref={virtuosoRef}
                data={virtualizedItems}
                itemContent={itemContent}
                startReached={handleStartReached}
                followOutput={(isAtBottom) => isAtBottom ? "smooth" : false}
                atBottomStateChange={setAtBottom}
                initialTopMostItemIndex={virtualizedItems.length - 1}
                alignToBottom
                className="h-full overflow-x-hidden"
                style={{ overflowX: 'hidden' }}
                components={{
                  Header: () => Header,
                }}
              />
              
              {/* Scroll to bottom button - centered */}
              {!atBottom && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 z-10"
                  aria-label="Scroll to bottom"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

        {/* Message input */}
        <MessageInput
          onSend={handleSendMessage}
          disabled={isLoading}
          replyTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      </div>

      {/* Group Settings Sheet */}
      {isGroup && (
        <GroupSettingsSheet
          open={showGroupSettings}
          onOpenChange={setShowGroupSettings}
          conversation={conversation}
          currentUserId={currentUserId}
        />
      )}
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
          className={cn(
            "flex items-end gap-2",
            i % 2 === 0 ? "" : "flex-row-reverse"
          )}
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
