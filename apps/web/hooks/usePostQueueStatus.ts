"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostQueueItem } from "@/types/postQueue";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  deleteQueueStatus,
  getQueueStatusByUser,
} from "@/services/postQueueStatusService";
import { useGetCurrentUser } from "./useAuth";

/**
 * Hook to subscribe to real-time queue status updates via Supabase Realtime
 * Shows toast notifications for each status change
 */
export function usePostQueueStatus() {
  const [queueItems, setQueueItems] = useState<PostQueueItem[]>([]);
  const { data: user } = useGetCurrentUser();
  const queryClient = useQueryClient();
  const toastIdsRef = useRef<Map<string, string | number>>(new Map());

  useEffect(() => {
    if (!user?.id) return;

    let supabaseClient: Awaited<ReturnType<typeof createClient>>;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      supabaseClient = await createClient();

      // Fetch initial queue items
      const initialItems = await getQueueStatusByUser(user.id);
      setQueueItems(initialItems);

      // Set up Realtime subscription
      channel = supabaseClient
        .channel("post_queue_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "post_queue_status",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Queue status change:", payload);

            if (payload.eventType === "INSERT") {
              const newItem = payload.new as PostQueueItem;
              setQueueItems((prev) => [newItem, ...prev]);

              // Show loading toast
              const toastId = toast.loading(
                `Đang tải lên bài viết${
                  newItem.media_count! > 0
                    ? ` với ${newItem.media_count} file`
                    : ""
                }...`
              );
              toastIdsRef.current.set(newItem.id, toastId);
            } else if (payload.eventType === "UPDATE") {
              const updatedItem = payload.new as PostQueueItem;
              setQueueItems((prev) =>
                prev.map((item) =>
                  item.id === updatedItem.id ? updatedItem : item
                )
              );

              const existingToastId = toastIdsRef.current.get(updatedItem.id);

              if (updatedItem.status === "processing") {
                // Update toast to processing
                if (existingToastId) {
                  toast.loading("Đang xử lý bài viết...", {
                    id: existingToastId,
                  });
                }
              } else if (updatedItem.status === "completed") {
                // Success toast
                if (existingToastId) {
                  toast.success("Bài viết đã đăng thành công!", {
                    id: existingToastId,
                  });
                }

                // Invalidate posts query to refetch with new post
                queryClient.invalidateQueries({ queryKey: ["posts"] });

                // Remove from queue items after a delay
                setTimeout(() => {
                  setQueueItems((prev) =>
                    prev.filter((item) => item.id !== updatedItem.id)
                  );
                  toastIdsRef.current.delete(updatedItem.id);

                  // Delete from database
                  deleteQueueStatus(updatedItem.id);
                }, 5000);
              } else if (updatedItem.status === "failed") {
                // Error toast with retry option
                if (existingToastId) {
                  toast.dismiss(existingToastId);
                }

                toast.error(updatedItem.error_message || "Lỗi khi đăng bài", {
                  description: `Đã thử ${updatedItem.retry_count} lần`,
                  action: {
                    label: "Đóng",
                    onClick: () => {
                      // Remove failed item
                      setQueueItems((prev) =>
                        prev.filter((item) => item.id !== updatedItem.id)
                      );
                      deleteQueueStatus(updatedItem.id);
                    },
                  },
                  duration: Infinity, // Keep visible
                });
                toastIdsRef.current.delete(updatedItem.id);
              }
            } else if (payload.eventType === "DELETE") {
              const deletedItem = payload.old as PostQueueItem;
              setQueueItems((prev) =>
                prev.filter((item) => item.id !== deletedItem.id)
              );
              toastIdsRef.current.delete(deletedItem.id);
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user?.id, queryClient]);

  // Get only pending/processing items for UI display
  const pendingItems = queueItems.filter(
    (item) => item.status === "pending" || item.status === "processing"
  );

  return {
    queueItems: pendingItems,
    hasPendingPosts: pendingItems.length > 0,
  };
}
