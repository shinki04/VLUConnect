"use client";

import { Tables } from "@repo/shared/types/database.types";
import type {
  MessageStatus,
  MessageWithSender,
  OptimisticMessage,
} from "@repo/shared/types/messaging";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getMessages,
  markAsRead,
  sendMessage as sendMessageAction,
} from "@/app/actions/messaging";
import { createClient } from "@/lib/supabase/client";

interface UseMessagesOptions {
  conversationId: string;
  currentUserId: string;
  currentUser?: Tables<"profiles">;
  enabled?: boolean;
}

interface UseMessagesReturn {
  messages: (MessageWithSender | OptimisticMessage)[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (tempId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const MESSAGES_PER_PAGE = 50;

/**
 * Hook for managing messages with optimistic UI and realtime updates
 * Provides smooth UX with instant message display and retry on failure
 */
export function useMessages({
  conversationId,
  currentUserId,
  currentUser,
  enabled = true,
}: UseMessagesOptions): UseMessagesReturn {
  const supabase = createClient();

  // Server messages (confirmed from DB)
  const [serverMessages, setServerMessages] = useState<MessageWithSender[]>([]);
  // Optimistic messages (pending/failed)
  const [optimisticMessages, setOptimisticMessages] = useState<
    OptimisticMessage[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const cursorRef = useRef<string | undefined>(undefined);

  // Combine server and optimistic messages
  const messages = [
    ...serverMessages,
    ...optimisticMessages.filter((m) => m.status !== "sent"),
  ];

  // Generate temporary ID for optimistic messages
  const generateTempId = useCallback(() => {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!enabled || !conversationId) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await getMessages(conversationId, MESSAGES_PER_PAGE);
      setServerMessages(data);
      setHasMore(data.length === MESSAGES_PER_PAGE);

      if (data.length > 0) {
        cursorRef.current = data[0]?.created_at || undefined;
      }

      // Mark conversation as read
      await markAsRead(conversationId);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch messages")
      );
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, enabled]);

  // Load more (older) messages
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !cursorRef.current) return;

    try {
      setIsLoadingMore(true);
      const data = await getMessages(
        conversationId,
        MESSAGES_PER_PAGE,
        cursorRef.current
      );

      setServerMessages((prev) => [...data, ...prev]);
      setHasMore(data.length === MESSAGES_PER_PAGE);

      if (data.length > 0) {
        cursorRef.current = data[0]?.created_at || undefined;
      }
    } catch (err) {
      console.error("Error loading more messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, hasMore, isLoadingMore]);

  // Send message with optimistic UI
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const tempId = generateTempId();

      // Create optimistic message
      const optimisticMessage: OptimisticMessage = {
        tempId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim(),
        message_type: "text",
        created_at: new Date().toISOString(),
        status: "sending",
        sender: currentUser,
        is_deleted: false,
        is_edited: false,
      };

      // Add to optimistic list immediately (instant UI feedback)
      setOptimisticMessages((prev) => [...prev, optimisticMessage]);

      try {
        // Send to server
        const serverMessage = await sendMessageAction(
          conversationId,
          content,
          "text",
          tempId
        );

        // Mark as sent and remove from optimistic (will be added via realtime)
        setOptimisticMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempId ? { ...m, status: "sent" as MessageStatus } : m
          )
        );

        // If realtime doesn't pick it up quickly, add to server messages
        setTimeout(() => {
          setOptimisticMessages((prev) =>
            prev.filter((m) => m.tempId !== tempId)
          );
          setServerMessages((prev) => {
            if (!prev.find((m) => m.id === serverMessage.id)) {
              return [
                ...prev,
                { ...serverMessage, sender: currentUser } as MessageWithSender,
              ];
            }
            return prev;
          });
        }, 500);
      } catch (err) {
        // Mark as failed
        setOptimisticMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempId
              ? {
                  ...m,
                  status: "failed" as MessageStatus,
                  error:
                    err instanceof Error ? err.message : "Failed to send",
                  retryCount: (m.retryCount || 0) + 1,
                }
              : m
          )
        );
        console.error("Error sending message:", err);
      }
    },
    [conversationId, currentUserId, currentUser, generateTempId]
  );

  // Retry failed message
  const retryMessage = useCallback(
    async (tempId: string) => {
      const message = optimisticMessages.find((m) => m.tempId === tempId);
      if (!message || message.status !== "failed") return;

      // Reset status to sending
      setOptimisticMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId
            ? { ...m, status: "sending" as MessageStatus, error: undefined }
            : m
        )
      );

      try {
        const serverMessage = await sendMessageAction(
          conversationId,
          message.content || "",
          "text",
          tempId
        );

        setOptimisticMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempId ? { ...m, status: "sent" as MessageStatus } : m
          )
        );

        setTimeout(() => {
          setOptimisticMessages((prev) =>
            prev.filter((m) => m.tempId !== tempId)
          );
          setServerMessages((prev) => {
            if (!prev.find((m) => m.id === serverMessage.id)) {
              return [
                ...prev,
                { ...serverMessage, sender: currentUser } as MessageWithSender,
              ];
            }
            return prev;
          });
        }, 500);
      } catch (err) {
        setOptimisticMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempId
              ? {
                  ...m,
                  status: "failed" as MessageStatus,
                  error:
                    err instanceof Error ? err.message : "Failed to send",
                  retryCount: (m.retryCount || 0) + 1,
                }
              : m
          )
        );
      }
    },
    [conversationId, currentUser, optimisticMessages]
  );

  // Subscribe to realtime updates
  useEffect(() => {
    if (!enabled || !conversationId) return;

    // Fetch initial messages
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log("[Realtime] New message received:", payload);
          const newMessage = payload.new as MessageWithSender;

          // Skip if it's from current user (already handled optimistically)
          if (newMessage.sender_id === currentUserId) {
            // Just remove the optimistic version
            setOptimisticMessages((prev) =>
              prev.filter((m) => m.status !== "sent")
            );
            // Add to server messages if not already there
            setServerMessages((prev) => {
              if (!prev.find((m) => m.id === newMessage.id)) {
                // Fetch sender info
                supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", newMessage.sender_id || "")
                  .single()
                  .then(({ data: sender }) => {
                    setServerMessages((current) => [
                      ...current.filter((m) => m.id !== newMessage.id),
                      { ...newMessage, sender: sender || undefined },
                    ]);
                  });
                return prev;
              }
              return prev;
            });
            return;
          }

          // Fetch sender info for other users' messages
          const { data: sender } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newMessage.sender_id || "")
            .single();

          setServerMessages((prev) => [
            ...prev,
            { ...newMessage, sender: sender || undefined },
          ]);

          // Mark as read
          markAsRead(conversationId);
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Channel status:", status);
      });

    channelRef.current = channel;

    return () => {
      console.log("[Realtime] Unsubscribing from channel");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, currentUserId, enabled, fetchMessages, supabase]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    retryMessage,
    loadMore,
    hasMore,
    isLoadingMore,
  };
}
