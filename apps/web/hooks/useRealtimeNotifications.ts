"use client";

import { createClient } from "@repo/supabase/client";
import type { RealtimePostgresInsertPayload } from "@repo/supabase/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { conversationKeys } from "./useConversations";
import { markAsRead } from "@/app/actions/messaging";

interface UseRealtimeNotificationsOptions {
  currentUserId: string;
  /** Currently active conversation ID - won't increment unread for this */
  activeConversationId?: string | null;
  /** Enable/disable the listener */
  enabled?: boolean;
}

interface MessageInsertPayload {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  created_at: string;
  is_deleted: boolean;
  is_edited: boolean;
}

interface ConversationCacheItem {
  id: string;
  unreadCount?: number;
  lastMessage?: {
    id: string;
    content: string | null;
    created_at: string;
    sender_id: string;
    message_type: string;
    is_deleted: boolean;
    is_edited: boolean;
    conversation_id: string;
  };
  last_message_at?: string | null;
}

/**
 * Global real-time notification listener
 * Subscribes to postgres_changes to receive notifications for:
 * - New messages in any conversation
 * - (Future) Friend requests, likes, comments, etc.
 * 
 * Updates TanStack Query cache to reflect real-time changes
 */
export function useRealtimeNotifications({
  currentUserId,
  activeConversationId,
  enabled = true,
}: UseRealtimeNotificationsOptions) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  
  // Keep refs to avoid stale closures
  const activeConversationIdRef = useRef(activeConversationId);
  
  // Update ref in an effect to avoid "Cannot update ref during render"
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // Clear unread count for a conversation
  const clearUnreadCount = useCallback((conversationId: string) => {
    queryClient.setQueryData(
      conversationKeys.list(),
      (oldData: unknown) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.map((conv: ConversationCacheItem) => {
          if (conv.id === conversationId) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        });
      }
    );
  }, [queryClient]);

  // Mark as read when active conversation changes (BOTH cache and server)
  useEffect(() => {
    if (activeConversationId) {
      // Immediately clear cache for instant UI feedback
      clearUnreadCount(activeConversationId);
      // Persist to server so it survives refetch
      markAsRead(activeConversationId).catch((error) => {
        console.error("[RealtimeNotifications] Error marking conversation as read:", error);
      });
    }
  }, [activeConversationId, clearUnreadCount]);

  useEffect(() => {
    if (!enabled || !currentUserId) return;

    console.log("[RealtimeNotifications] Setting up listener for user:", currentUserId);

    const channel = supabase.channel(`notifications:${currentUserId}`)
      // Listen for new messages
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload: RealtimePostgresInsertPayload<MessageInsertPayload>) => {
          const newMessage = payload.new;
          
          console.log("[RealtimeNotifications] New message:", newMessage);

          const isOwnMessage = newMessage.sender_id === currentUserId;
          const isViewingConversation = activeConversationIdRef.current === newMessage.conversation_id;

          // Update conversation list cache
          queryClient.setQueryData(
            conversationKeys.list(),
            (oldData: unknown) => {
              if (!oldData || !Array.isArray(oldData)) return oldData;

              const updatedList = oldData.map((conv: ConversationCacheItem) => {
                if (conv.id === newMessage.conversation_id) {
                  // Always update lastMessage and last_message_at
                  const updated = {
                    ...conv,
                    lastMessage: {
                      id: newMessage.id,
                      content: newMessage.content,
                      created_at: newMessage.created_at,
                      sender_id: newMessage.sender_id,
                      message_type: newMessage.message_type,
                      is_deleted: newMessage.is_deleted,
                      is_edited: newMessage.is_edited,
                      conversation_id: newMessage.conversation_id,
                    },
                    last_message_at: newMessage.created_at,
                  };

                  // Only increment unread count for messages from others when not viewing
                  if (!isOwnMessage && !isViewingConversation) {
                    updated.unreadCount = (conv.unreadCount || 0) + 1;
                  }

                  return updated;
                }
                return conv;
              });

              // Re-sort by last_message_at (most recent first)
              return updatedList.sort((a: ConversationCacheItem, b: ConversationCacheItem) => {
                const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                return dateB - dateA;
              });
            }
          );

          console.log("[RealtimeNotifications] Updated conversation:", newMessage.conversation_id, isOwnMessage ? "(own message)" : "(from other)");
        }
      )
      // Future: Listen for friend requests
      // .on(
      //   "postgres_changes",
      //   { event: "INSERT", schema: "public", table: "friendships" },
      //   handleFriendRequest
      // )
      .subscribe((status) => {
        console.log("[RealtimeNotifications] Channel status:", status);
      });

    return () => {
      console.log("[RealtimeNotifications] Unsubscribing from channel");
      supabase.removeChannel(channel);
    };
  }, [currentUserId, enabled, queryClient, supabase]);

  // Mark conversation as read (both server and cache)
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      // Optimistically clear cache first for instant UI update
      clearUnreadCount(conversationId);
      // Then persist to server
      await markAsRead(conversationId);
      console.log("[RealtimeNotifications] Successfully marked as read:", conversationId);
    } catch (error) {
      console.error("[RealtimeNotifications] Error marking as read:", error);
      // Refetch conversations to revert optimistic update on failure
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    }
  }, [clearUnreadCount, queryClient]);

  return { clearUnreadCount, markConversationAsRead };
}
