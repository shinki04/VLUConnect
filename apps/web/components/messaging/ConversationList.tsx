"use client";

import type { ConversationWithDetails } from "@repo/shared/types/messaging";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus, Search } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { messagesQueryOptions } from "@/hooks/useMessagesQuery";

import { ConversationItem, ConversationListEmpty } from "./ConversationItem";

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  currentUserId: string;
  activeConversationId?: string;
  isLoading?: boolean;
  onSelectConversation: (id: string) => void;
  onNewConversation?: () => void;
  onMarkAsRead?: (conversationId: string) => void;
  className?: string;
}

// Fixed height for conversation items
const ITEM_HEIGHT = 72;

/**
 * Virtualized list of conversations with search and new conversation button
 */
export function ConversationList({
  conversations,
  currentUserId,
  activeConversationId,
  isLoading = false,
  onSelectConversation,
  onNewConversation,
  onMarkAsRead,
  className,
}: ConversationListProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  // Prefetch messages on hover for instant loading
  const handleMouseEnter = useCallback(
    (conversationId: string) => {
      queryClient.prefetchInfiniteQuery(messagesQueryOptions(conversationId));
    },
    [queryClient]
  );

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      // Search in group name
      if (conv.name?.toLowerCase().includes(query)) return true;

      // Search in member names
      const memberMatch = conv.members?.some((m) => {
        const profile = m.profile;
        return (
          profile?.display_name?.toLowerCase().includes(query) ||
          profile?.slug?.toLowerCase().includes(query) ||
          profile?.username?.toLowerCase().includes(query) 
        );
      });
      if (memberMatch) return true;

      // Search in last message
      if (conv.lastMessage?.content.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [conversations, searchQuery]);

  // Setup virtualizer
  const virtualizer = useVirtualizer({
    count: filteredConversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b border-chat-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Tin nhắn</h2>
          {onNewConversation && (
            <Button
              size="icon"
              className="h-10 w-10 shrink-0 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              onClick={onNewConversation}
            >
              <Plus className="h-5 w-5" />
              <span className="sr-only">Tin nhắn mới</span>
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative group mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Tìm kiếm hội thoại..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="w-full pl-10 pr-4 py-2.5 bg-background dark:bg-background-dark border border-chat-border rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent outline-none transition-all text-sm h-auto"
          />
        </div>
      </div>

      {/* Virtualized conversations list */}
      <div ref={parentRef} className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <ConversationListSkeleton />
        ) : filteredConversations.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy cuộc trò chuyện
            </div>
          ) : (
            <ConversationListEmpty />
          )
        ) : (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualItem) => {
              const conversation = filteredConversations[virtualItem.index]!;
              return (
                <div
                  key={conversation.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  onMouseEnter={() => handleMouseEnter(conversation.id)}
                >
                  <ConversationItem
                    conversation={conversation}
                    currentUserId={currentUserId}
                    isActive={conversation.id === activeConversationId}
                    onClick={() => onSelectConversation(conversation.id)}
                    onMarkAsRead={onMarkAsRead}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for conversation list
 */
function ConversationListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
