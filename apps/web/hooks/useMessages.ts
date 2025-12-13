"use client";

import { Tables } from "@repo/shared/types/database.types";
import type {
  MessageStatus,
  MessageWithSender,
  OptimisticMessage,
} from "@repo/shared/types/messaging";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo,useRef, useState } from "react";

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

// Broadcast event types
interface BroadcastMessage {
  type: "new_message" | "message_sent" | "message_failed";
  tempId: string;
  message?: MessageWithSender;
  error?: string;
  senderId: string;
}

const MESSAGES_PER_PAGE = 50;

/**
 * Hook for managing messages with Supabase Broadcast for optimistic UI
 * Uses Broadcast for instant message delivery without waiting for DB
 */
export function useMessages({
  conversationId,
  currentUserId,
  currentUser,
  enabled = true,
}: UseMessagesOptions): UseMessagesReturn {
  const supabase = useMemo(() => createClient(), []);

  // Server messages (confirmed from DB)
  const [serverMessages, setServerMessages] = useState<MessageWithSender[]>([]);
  // Optimistic messages (pending/failed - from broadcast)
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
  const messages = useMemo(() => {
    const combined = [
      ...serverMessages,
      ...optimisticMessages.filter((m) => m.status !== "sent"),
    ];
    // Sort by created_at
    return combined.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateA - dateB;
    });
  }, [serverMessages, optimisticMessages]);

  // Generate temporary ID for optimistic messages
  const generateTempId = useCallback(() => {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Fetch initial messages from DB
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

  // Send message with Broadcast for instant delivery
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !channelRef.current) return;

      const tempId = generateTempId();
      const now = new Date().toISOString();

      // Create optimistic message
      const optimisticMessage: OptimisticMessage = {
        tempId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim(),
        message_type: "text",
        created_at: now,
        status: "sending",
        sender: currentUser,
        is_deleted: false,
        is_edited: false,
      };

      // Add to local optimistic list immediately
      setOptimisticMessages((prev) => [...prev, optimisticMessage]);

      // Broadcast to all subscribers (including self) for instant UI update
      channelRef.current.send({
        type: "broadcast",
        event: "new_message",
        payload: {
          type: "new_message",
          tempId,
          message: optimisticMessage,
          senderId: currentUserId,
        } as BroadcastMessage,
      });

      // Save to database in background
      try {
        const serverMessage = await sendMessageAction(
          conversationId,
          content,
          "text",
          tempId
        );

        // Broadcast success - update status
        channelRef.current?.send({
          type: "broadcast",
          event: "message_sent",
          payload: {
            type: "message_sent",
            tempId,
            message: { ...serverMessage, sender: currentUser },
            senderId: currentUserId,
          } as BroadcastMessage,
        });

        // Update local state: remove optimistic, add server message
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
      } catch (err) {
        // Broadcast failure
        channelRef.current?.send({
          type: "broadcast",
          event: "message_failed",
          payload: {
            type: "message_failed",
            tempId,
            error: err instanceof Error ? err.message : "Failed to send",
            senderId: currentUserId,
          } as BroadcastMessage,
        });

        // Mark as failed locally
        setOptimisticMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempId
              ? {
                  ...m,
                  status: "failed" as MessageStatus,
                  error: err instanceof Error ? err.message : "Failed to send",
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

        // Success - remove optimistic, add to server messages
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
      } catch (err) {
        setOptimisticMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempId
              ? {
                  ...m,
                  status: "failed" as MessageStatus,
                  error: err instanceof Error ? err.message : "Failed to send",
                  retryCount: (m.retryCount || 0) + 1,
                }
              : m
          )
        );
      }
    },
    [conversationId, currentUser, optimisticMessages]
  );

  // Handle broadcast events from other users
  const handleBroadcastEvent = useCallback(
    async (payload: BroadcastMessage) => {
      console.log("[Broadcast] Received:", payload.type, payload);

      // Skip own messages (already handled locally)
      if (payload.senderId === currentUserId) {
        return;
      }

      switch (payload.type) {
        case "new_message":
          // Add message from other user immediately
          if (payload.message) {
            const newMessage = payload.message;
            
            // Fetch sender info if not included
            let senderProfile = newMessage.sender;
            if (!senderProfile && newMessage.sender_id) {
              const { data: sender } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", newMessage.sender_id)
                .single();
              senderProfile = sender || undefined;
            }

            // Add as optimistic for now (will be replaced when we fetch from DB)
            setOptimisticMessages((prev) => {
              // Check if already exists
              if (prev.find((m) => m.tempId === payload.tempId)) {
                return prev;
              }
              return [
                ...prev,
                {
                  ...newMessage,
                  tempId: payload.tempId,
                  status: "sending" as MessageStatus,
                  sender: senderProfile,
                },
              ];
            });
          }
          break;

        case "message_sent":
          // Message confirmed saved - move from optimistic to server
          if (payload.message) {
            setOptimisticMessages((prev) =>
              prev.filter((m) => m.tempId !== payload.tempId)
            );
            setServerMessages((prev) => {
              if (!prev.find((m) => m.id === payload.message?.id)) {
                return [...prev, payload.message as MessageWithSender];
              }
              return prev;
            });
          }
          // Mark as read
          markAsRead(conversationId);
          break;

        case "message_failed":
          // Remove failed message from other user (they'll retry)
          setOptimisticMessages((prev) =>
            prev.filter((m) => m.tempId !== payload.tempId)
          );
          break;
      }
    },
    [conversationId, currentUserId, supabase]
  );

  // Subscribe to Broadcast channel
  useEffect(() => {
    if (!enabled || !conversationId) return;

    // Fetch initial messages from DB
    fetchMessages();

    // Create Broadcast channel for this conversation
    const channel = supabase.channel(`chat:${conversationId}`, {
      config: {
        broadcast: {
          // Receive own broadcasts for consistency
          self: true,
        },
      },
    });

    // Listen for broadcast events
    channel
      .on("broadcast", { event: "new_message" }, ({ payload }) => {
        handleBroadcastEvent(payload as BroadcastMessage);
      })
      .on("broadcast", { event: "message_sent" }, ({ payload }) => {
        handleBroadcastEvent(payload as BroadcastMessage);
      })
      .on("broadcast", { event: "message_failed" }, ({ payload }) => {
        handleBroadcastEvent(payload as BroadcastMessage);
      })
      .subscribe((status) => {
        console.log("[Broadcast] Channel status:", status);
      });

    channelRef.current = channel;

    return () => {
      console.log("[Broadcast] Unsubscribing from channel");
      supabase.removeChannel(channel);
    };
  }, [conversationId, enabled, fetchMessages, handleBroadcastEvent, supabase]);

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
