"use client";

import type { ConversationWithDetails } from "@repo/shared/types/messaging";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { ConversationItem, ConversationListEmpty } from "./ConversationItem";

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  currentUserId: string;
  activeConversationId?: string;
  isLoading?: boolean;
  onSelectConversation: (id: string) => void;
  onNewConversation?: () => void;
  className?: string;
}

/**
 * List of conversations with search and new conversation button
 */
export function ConversationList({
  conversations,
  currentUserId,
  activeConversationId,
  isLoading = false,
  onSelectConversation,
  onNewConversation,
  className,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

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
          profile?.username?.toLowerCase().includes(query)
        );
      });
      if (memberMatch) return true;

      // Search in last message
      if (conv.lastMessage?.content.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [conversations, searchQuery]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tin nhắn</h2>
          {onNewConversation && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onNewConversation}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Tin nhắn mới</span>
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <>
            <p>Đang tải ...</p>
            <ConversationListSkeleton />
          </>
        ) : filteredConversations.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy cuộc trò chuyện
            </div>
          ) : (
            <ConversationListEmpty />
          )
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUserId}
                isActive={conversation.id === activeConversationId}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))}
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
