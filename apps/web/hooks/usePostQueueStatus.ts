"use client";

import { PostQueueItem } from "@repo/shared/types/postQueue";
import { createClient } from "@repo/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  deleteQueueStatus,
  getQueueStatusByUser,
} from "@/app/actions/post-queue";

import { useGetCurrentUser } from "./useAuth";

export function usePostQueueStatus(groupId?: string) {
  const [queueItems, setQueueItems] = useState<PostQueueItem[]>([]);
  const { data: user } = useGetCurrentUser();
  const queryClient = useQueryClient();
  const toastIdsRef = useRef<Map<string, string | number>>(new Map());

  useEffect(() => {
    if (!user?.id) return;

    let supabaseClient: Awaited<ReturnType<typeof createClient>>;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      supabaseClient = createClient();

      // Fetch initial queue items
      const initialItems = await getQueueStatusByUser(user.id);
      setQueueItems(initialItems);

      // Set up Realtime subscription
      // Note: We subscribe to ALL user changes, filtering happens in UI
      // This ensures we get updates even if we switch views
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

              // Kiểm tra trùng lặp trước khi thêm
              setQueueItems((prev) => {
                const exists = prev.some((item) => item.id === newItem.id);
                if (exists) return prev;
                return [newItem, ...prev];
              });

              // Chỉ show toast nếu đúng context hoặc là global notification
              // Tạm thời show global toast
              if (!toastIdsRef.current.has(newItem.id)) {
                const toastId = toast.loading(
                  `Đang tải lên bài viết${
                    newItem.media_count! > 0
                      ? ` với ${newItem.media_count} file`
                      : ""
                  }...`
                );
                toastIdsRef.current.set(newItem.id, toastId);
              }
            } else if (payload.eventType === "UPDATE") {
              const updatedItem = payload.new as PostQueueItem;

              // Cập nhật queue items (đảm bảo không duplicate)
              setQueueItems((prev) => {
                const filtered = prev.filter(
                  (item) => item.id !== updatedItem.id
                );
                return [updatedItem, ...filtered];
              });

              const existingToastId = toastIdsRef.current.get(updatedItem.id);

              if (updatedItem.status === "processing") {
                // QUAN TRỌNG: Sử dụng cùng ID để UPDATE toast hiện tại
                if (existingToastId) {
                  toast.loading("Đang xử lý bài viết...", {
                    id: existingToastId, // Sử dụng cùng ID
                  });
                  // KHÔNG set lại trong ref vì đã có rồi
                } else {
                  // Nếu chưa có toast, tạo mới
                  const toastId = toast.loading("Đang xử lý bài viết...");
                  toastIdsRef.current.set(updatedItem.id, toastId);
                }
              } else if (updatedItem.status === "completed") {
                // Success toast
                if (existingToastId) {
                  // Tự động thay thế toast loading bằng success (không cần dismiss)
                  toast.success("Bài viết đã đăng thành công!", {
                    id: existingToastId, // Sử dụng cùng ID
                  });

                  // Xóa toastId khỏi ref sau 3 giây
                  setTimeout(() => {
                    toastIdsRef.current.delete(updatedItem.id);
                  }, 3000);
                } else {
                  toast.success("Bài viết đã đăng thành công!");
                }

                // Invalidate posts query
                queryClient.invalidateQueries({ queryKey: ["posts"] });
                if (updatedItem.group_id) {
                    // Also invalidate group posts if applicable
                    // We might need to import groupKeys here or use broad invalidation
                    // For now "posts" query keys might assume specific structure
                }

                // Remove from queue after delay
                setTimeout(() => {
                  setQueueItems((prev) =>
                    prev.filter((item) => item.id !== updatedItem.id)
                  );
                  deleteQueueStatus(updatedItem.id);
                }, 5000);
              } else if (updatedItem.status === "failed") {
                // Error toast
                if (existingToastId) {
                  // Tự động thay thế toast loading bằng error (không cần dismiss)
                  toast.error(updatedItem.error_message || "Lỗi khi đăng bài", {
                    id: existingToastId, // Sử dụng cùng ID
                    description: `Đã thử ${updatedItem.retry_count} lần`,
                    action: {
                      label: "Đóng",
                      onClick: () => {
                        setQueueItems((prev) =>
                          prev.filter((item) => item.id !== updatedItem.id)
                        );
                        deleteQueueStatus(updatedItem.id);
                        toastIdsRef.current.delete(updatedItem.id);
                      },
                    },
                    duration: 10000,
                  });
                } else {
                  toast.error(updatedItem.error_message || "Lỗi khi đăng bài", {
                    description: `Đã thử ${updatedItem.retry_count} lần`,
                    action: {
                      label: "Đóng",
                      onClick: () => {
                        setQueueItems((prev) =>
                          prev.filter((item) => item.id !== updatedItem.id)
                        );
                        deleteQueueStatus(updatedItem.id);
                      },
                    },
                    duration: 10000,
                  });
                }

                // Xóa khỏi ref sau 10 giây
                setTimeout(() => {
                  toastIdsRef.current.delete(updatedItem.id);
                }, 10000);
              }
            } else if (payload.eventType === "DELETE") {
              const deletedItem = payload.old as PostQueueItem;
              setQueueItems((prev) =>
                prev.filter((item) => item.id !== deletedItem.id)
              );

              // Dismiss toast
              const existingToastId = toastIdsRef.current.get(deletedItem.id);
              if (existingToastId) {
                toast.dismiss(existingToastId);
              }
              toastIdsRef.current.delete(deletedItem.id);
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }

      // Cleanup all toasts
      toastIdsRef.current.forEach((toastId) => {
        toast.dismiss(toastId);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
      toastIdsRef.current.clear();
    };
  }, [user?.id, queryClient]);

  // Get only pending/processing items (đảm bảo unique)
  const pendingItems = useMemo(() => {
    const uniqueItems = Array.from(
      new Map(queueItems.map((item) => [item.id, item])).values()
    );
    
    // Filter by status first
    let filtered = uniqueItems.filter(
      (item) => item.status === "pending" || item.status === "processing"
    );

    // Filter by groupId if provided
    if (groupId) {
      filtered = filtered.filter(item => item.group_id === groupId);
    } else {
        // If no groupId (main feed etc), maybe show all? 
        // Or show only non-group posts?
        // User didn't specify, but usually main feed shows purely personal + group posts.
        // For now, let's show ALL if no groupId is passed, but filter strictly if it is.
        // This solves "pending post hiển thị cả ở group post" because group post WILL pass groupId.
    }

    return filtered;
  }, [queueItems, groupId]); // Added groupId to dependency

  return {
    queueItems: pendingItems,
    hasPendingPosts: pendingItems.length > 0,
  };
}
