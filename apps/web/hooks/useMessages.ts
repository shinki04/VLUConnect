"use client";

import { Tables } from "@repo/shared/types/database.types";
import type {
  MessageStatus,
  MessageWithSender,
  OptimisticMessage,
} from "@repo/shared/types/messaging";
import type { PendingFile } from "@repo/shared/types/messaging";
import { createClient } from "@repo/supabase/client";
import type { RealtimeChannel } from "@repo/supabase/types";
import { useCallback, useEffect, useMemo,useRef, useState } from "react";

import {
  editMessage as editMessageAction,
  getMessages,
  recallMessage as recallMessageAction,
  sendMessage as sendMessageAction,
} from "@/app/actions/messaging";


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
  sendMessage: (content: string, replyTo?: { id: string; content: string | null; sender?: { display_name: string | null } }, files?: File[]) => Promise<void>;
  retryMessage: (tempId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  recallMessage: (messageId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoadingMore: boolean;
  hasFetchedOnce: boolean;
}

// Broadcast event types
interface BroadcastMessage {
  type: "new_message" | "message_sent" | "message_failed" | "message_edited" | "message_recalled";
  tempId: string;
  messageId?: string;
  message?: MessageWithSender;
  newContent?: string;
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
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const cursorRef = useRef<string | undefined>(undefined);

  // Stable refs for callbacks to prevent effect re-runs
  const currentUserIdRef = useRef(currentUserId);
  const conversationIdRef = useRef(conversationId);

  // Keep refs in sync
  currentUserIdRef.current = currentUserId;
  conversationIdRef.current = conversationId;

  // Combine server and optimistic messages
  const messages = useMemo(() => {
    const combined = [
      ...serverMessages,
      ...optimisticMessages.filter((m) => m.status !== "sent"),
    ];
    // Sort by created_at, but always keep 'sending' messages at the end
    return combined.sort((a, b) => {
      const aIsSending = "status" in a && a.status === "sending";
      const bIsSending = "status" in b && b.status === "sending";
      
      // If one is sending and the other is not, sending goes to the end
      if (aIsSending && !bIsSending) return 1;
      if (!aIsSending && bIsSending) return -1;
      
      // If both are sending or both are not sending, sort by created_at
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

      // Note: markAsRead is handled by useRealtimeNotifications when activeConversationId changes
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch messages")
      );
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoading(false);
      setHasFetchedOnce(true);
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

  // Upload files helper
  const uploadFilesAndGetUrls = useCallback(async (files: File[]): Promise<{ urls: string[]; pendingFiles: PendingFile[] }> => {
    const pendingFiles: PendingFile[] = files.map((file) => {
      const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      let localPreview: string | undefined;
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        localPreview = URL.createObjectURL(file);
      }
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        localPreview,
        progress: 0,
        status: "uploading" as const,
      };
    });

    // Upload each file directly to Supabase storage
    const uploadPromises = files.map(async (file, idx) => {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const extension = file.name.split(".").pop() || "";
      const objectName = `${conversationId}/${timestamp}-${randomStr}.${extension}`;

      const { data: { session } } = await supabase.auth.getSession();

      // Use standard upload for smaller files, or we could integrate Uppy here
      const { error } = await supabase.storage
        .from("messages")
        .upload(objectName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error("Upload failed for", file.name, error);
        throw new Error(`Upload failed: ${file.name}`);
      }

      const { data: urlData } = supabase.storage.
        from("messages")
        .getPublicUrl(objectName);

      return urlData.publicUrl;
    });

    const urls = await Promise.all(uploadPromises);

    // Revoke blob URLs after upload
    pendingFiles.forEach((pf) => {
      if (pf.localPreview) {
        URL.revokeObjectURL(pf.localPreview);
      }
    });

    return { urls, pendingFiles };
  }, [conversationId, supabase]);

  // Send message with Broadcast for instant delivery
  const sendMessage = useCallback(
    async (content: string, replyTo?: { id: string; content: string | null; sender?: { display_name: string | null } }, files?: File[]) => {
      // Allow sending if there's content OR files
      if ((!content.trim() && (!files || files.length === 0)) || !channelRef.current) return;

      // Limit to 10 files per message
      const MAX_FILES = 10;
      if (files && files.length > MAX_FILES) {
        throw new Error(`Chỉ được gửi tối đa ${MAX_FILES} file mỗi lần`);
      }

      const tempId = generateTempId();
      const now = new Date().toISOString();

      // Create pending files for display
      let pendingFilesForDisplay: PendingFile[] = [];
      if (files && files.length > 0) {
        pendingFilesForDisplay = files.map((file) => {
          const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          let localPreview: string | undefined;
          if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
            localPreview = URL.createObjectURL(file);
          }
          return {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            localPreview,
            progress: 0,
            status: "uploading" as const,
          };
        });
      }

      // Create optimistic message with reply info if replying
      const optimisticMessage: OptimisticMessage = {
        tempId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim() || (files?.length ? "Đang gửi file..." : ""),
        message_type: files?.length ? "file" : "text",
        created_at: now,
        status: "sending",
        sender: currentUser,
        is_deleted: false,
        is_edited: false,
        reply_to: replyTo ? {
          id: replyTo.id,
          content: replyTo.content,
          sender_id: null,
          sender: replyTo.sender ? { display_name: replyTo.sender.display_name } as Tables<"profiles"> : undefined,
        } : undefined,
        pendingFiles: pendingFilesForDisplay,
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

      // Handle file uploads in background (won't be cancelled when switching conversations)
      if (files && files.length > 0) {
        // Import and use the global upload manager
        const { uploadManager } = await import("@/stores/uploadStore");

        // Start background upload - this continues even if user switches conversations
        uploadManager.uploadFiles(
          conversationId,
          tempId,
          files,
          content,
          replyTo?.id,
          // On complete
          (urls) => {
            // Broadcast success
            channelRef.current?.send({
              type: "broadcast",
              event: "message_sent",
              payload: {
                type: "message_sent",
                tempId,
                message: {
                  id: tempId, // Will be replaced with real ID
                  content,
                  media_urls: urls,
                  sender: currentUser,
                  conversation_id: conversationId,
                  sender_id: currentUserId,
                  created_at: now,
                  message_type: "file",
                  is_deleted: false,
                  is_edited: false,
                },
                senderId: currentUserId,
              } as BroadcastMessage,
            });

            // Revoke blob URLs
            pendingFilesForDisplay.forEach((pf) => {
              if (pf.localPreview) {
                URL.revokeObjectURL(pf.localPreview);
              }
            });

            // Update local state
            setOptimisticMessages((prev) =>
              prev.filter((m) => m.tempId !== tempId)
            );
          },
          // On error
          (error) => {
            // Broadcast failure
            channelRef.current?.send({
              type: "broadcast",
              event: "message_failed",
              payload: {
                type: "message_failed",
                tempId,
                error,
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
                    error,
                    retryCount: (m.retryCount || 0) + 1,
                  }
                  : m
              )
            );
          }
        );
      } else {
        // No files - send text message directly
        try {
          const serverMessage = await sendMessageAction(
            conversationId,
            content,
            "text",
            tempId,
            replyTo?.id
          );

          // Broadcast success
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

          // Update local state
          setOptimisticMessages((prev) =>
            prev.filter((m) => m.tempId !== tempId)
          );
          setServerMessages((prev) => {
            if (prev.find((m) => m.id === serverMessage.id)) {
              return prev;
            }
            const newMessages = [
              ...prev,
              {
                ...serverMessage,
                sender: currentUser,
                reply_to: replyTo ? {
                  id: replyTo.id,
                  content: replyTo.content,
                  sender_id: null,
                  sender: replyTo.sender ? { display_name: replyTo.sender.display_name } as Tables<"profiles"> : undefined,
                } : undefined,
              } as MessageWithSender,
            ];
            return newMessages.sort((a, b) => {
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateA - dateB;
            });
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
      }
    },
    [conversationId, currentUserId, currentUser, generateTempId, supabase]
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
          if (prev.find((m) => m.id === serverMessage.id)) {
            return prev; // Already exists
          }
          const newMessages = [
            ...prev,
            { ...serverMessage, sender: currentUser } as MessageWithSender,
          ];
          return newMessages.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateA - dateB;
          });
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

  // Handle broadcast events from other users - using stable ref pattern
  const handleBroadcastEvent = useCallback(
    (payload: BroadcastMessage) => {
      console.log("[Broadcast] Received:", payload.type, payload);

      // Skip own messages (already handled locally)
      if (payload.senderId === currentUserIdRef.current) {
        return;
      }

      switch (payload.type) {
        case "new_message":
          // Add message from other user immediately
          // OPTIMIZATION: Use sender from broadcast payload directly, no extra fetch
          if (payload.message) {
            const newMessage = payload.message;

            // Add as optimistic for now (will be replaced when confirmed)
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
                  // Use sender from broadcast - already included
                  sender: newMessage.sender,
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
              if (prev.find((m) => m.id === payload.message?.id)) {
                return prev; // Already exists
              }
              const newMessages = [...prev, payload.message as MessageWithSender];
              return newMessages.sort((a, b) => {
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                return dateA - dateB;
              });
            });
          }
          // Note: markAsRead is handled by useRealtimeNotifications when conversation is active
          break;

        case "message_failed":
          // Remove failed message from other user (they'll retry)
          setOptimisticMessages((prev) =>
            prev.filter((m) => m.tempId !== payload.tempId)
          );
          break;

        case "message_edited":
          // Update message content in server messages
          if (payload.messageId && payload.newContent !== undefined) {
            setServerMessages((prev) =>
              prev.map((m) =>
                m.id === payload.messageId
                  ? { ...m, content: payload.newContent!, is_edited: true }
                  : m
              )
            );
          }
          break;

        case "message_recalled":
          // Mark message as deleted
          if (payload.messageId) {
            setServerMessages((prev) =>
              prev.map((m) =>
                m.id === payload.messageId
                  ? { ...m, content: "Tin nhắn đã được thu hồi", is_deleted: true }
                  : m
              )
            );
          }
          break;
      }
    },
    [] // Empty deps - uses refs for stable reference
  );

  // Edit message with broadcast
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!newContent.trim() || !channelRef.current) return;

      // Optimistic update locally
      setServerMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: newContent.trim(), is_edited: true }
            : m
        )
      );

      // Broadcast edit to other users
      channelRef.current.send({
        type: "broadcast",
        event: "message_edited",
        payload: {
          type: "message_edited",
          tempId: "",
          messageId,
          newContent: newContent.trim(),
          senderId: currentUserId,
        } as BroadcastMessage,
      });

      // Save to database
      try {
        await editMessageAction(messageId, newContent);
        console.log("✅ Message edited:", messageId);
      } catch (err) {
        console.error("❌ Error editing message:", err);
        // Revert optimistic update could be added here
        throw err;
      }
    },
    [currentUserId]
  );

  // Recall message with broadcast
  const recallMessage = useCallback(
    async (messageId: string) => {
      if (!channelRef.current) return;

      // Optimistic update locally
      setServerMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: "Tin nhắn đã được thu hồi", is_deleted: true }
            : m
        )
      );

      // Broadcast recall to other users
      channelRef.current.send({
        type: "broadcast",
        event: "message_recalled",
        payload: {
          type: "message_recalled",
          tempId: "",
          messageId,
          senderId: currentUserId,
        } as BroadcastMessage,
      });

      // Save to database
      try {
        await recallMessageAction(messageId);
        console.log("✅ Message recalled:", messageId);
      } catch (err) {
        console.error("❌ Error recalling message:", err);
        throw err;
      }
    },
    [currentUserId]
  );

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!enabled || !conversationId) return;
    fetchMessages();
  }, [conversationId, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to Broadcast + Postgres Realtime channels
  // Separate effect to prevent re-subscription when fetchMessages changes
  useEffect(() => {
    if (!enabled || !conversationId) return;

    // Channel 1: Broadcast for user actions (optimistic updates)
    const broadcastChannel = supabase.channel(`chat:${conversationId}`, {
      config: {
        broadcast: {
          // Receive own broadcasts for consistency
          self: true,
        },
      },
    });

    // Listen for broadcast events
    broadcastChannel
      .on("broadcast", { event: "new_message" }, ({ payload }) => {
        handleBroadcastEvent(payload as BroadcastMessage);
      })
      .on("broadcast", { event: "message_sent" }, ({ payload }) => {
        handleBroadcastEvent(payload as BroadcastMessage);
      })
      .on("broadcast", { event: "message_failed" }, ({ payload }) => {
        handleBroadcastEvent(payload as BroadcastMessage);
      })
      .on("broadcast", { event: "message_edited" }, ({ payload }) => {
        handleBroadcastEvent(payload as BroadcastMessage);
      })
      .on("broadcast", { event: "message_recalled" }, ({ payload }) => {
        handleBroadcastEvent(payload as BroadcastMessage);
      })
      .subscribe((status) => {
        console.log("[Broadcast] Channel status:", status);
      });

    // Channel 2: Postgres changes for AI/admin actions
    const dbChannel = supabase
      .channel(`db:messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("[DB Update] Message changed:", payload.new.id);

          // Update message in serverMessages (e.g., AI/admin recalled it)
          // Skip if sender is current user (already handled by broadcast)
          if (payload.new.sender_id !== currentUserIdRef.current) {
            setServerMessages((prev) =>
              prev.map((m) =>
                m.id === payload.new.id
                  ? { ...m, ...payload.new as MessageWithSender }
                  : m
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("[DB Channel] Status:", status);
      });

    channelRef.current = broadcastChannel;

    return () => {
      console.log("[Realtime] Unsubscribing from channels");
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(dbChannel);
    };
  }, [conversationId, enabled, supabase, handleBroadcastEvent]);

  return {
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
  };
}