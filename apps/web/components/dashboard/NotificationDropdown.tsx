"use client";

import {
  NotificationType,
  NotificationWithSender,
} from "@repo/shared/types/notification";
import { BLANK_AVATAR } from "@repo/shared/types/user";
import { createClient } from "@repo/supabase/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { BellIcon } from "@repo/ui/components/bell";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { InfiniteData,useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CheckCircle2,
  File,
  Heart,
  Info,
  Loader2,
  MessageSquare,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/app/actions/notifications";
import { useGetCurrentUser } from "@/hooks/useAuth";
import { useInfiniteNotifications } from "@/hooks/useInfiniteNotifications";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "like":
      return <Heart className="h-4 w-4 text-red-500" />;
    case "comment":
    case "post_reply":
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case "friend":
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case "system":
      return <Info className="h-4 w-4 text-purple-500" />;
    case "group":
      return <Users className="h-4 w-4 text-orange-500" />;
    case "follow":
      return <UserPlus className="h-4 w-4 text-blue-400" />;
    case "post":
      return <File className="h-4 w-4 text-blue-400" />;
    default:
      return <BellIcon className="h-4 w-4 text-slate-500" />;
  }
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteNotifications();

  const { ref, inView } = useInView();
  const { data: user } = useGetCurrentUser();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  useEffect(() => {
    const supabase = createClient();
    // Get the current user to verify recipient
    const setupRealtime = async () => {
      if (!user) return;

      const channel = supabase
        .channel(`public:notifications:recipient_id=eq.${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT", // Listen to all events (INSERT/UPDATE/DELETE)
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          () => {
            // Invalidate the query to fetch fresh notifications
            queryClient.invalidateQueries({
              queryKey: ["notifications", "infinite"],
            });
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtime();

    return () => {
      cleanup.then((cleanFn) => cleanFn && cleanFn());
    };
  }, [queryClient]);

  // Flatten the infinite query data structure
  const notifications = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.notifications) || [];
  }, [data]);

  const unreadCount = React.useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // Optimistic update
      queryClient.setQueryData<
        InfiniteData<{
          notifications: NotificationWithSender[];
          nextOffset?: number;
        }>
      >(["notifications", "infinite"], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) =>
              n.id === id ? { ...n, is_read: true } : n,
            ),
          })),
        };
      });
      await markNotificationAsRead(id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Revert optimism on error
      refetch();
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // Optimistic update
      queryClient.setQueryData<
        InfiniteData<{
          notifications: NotificationWithSender[];
          nextOffset?: number;
        }>
      >(["notifications", "infinite"], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) => ({
              ...n,
              is_read: true,
            })),
          })),
        };
      });
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      refetch();
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-1.5 md:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
          <BellIcon className="w-5 h-5 md:w-6 md:h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mainred opacity-75"></span>
              <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-mainred text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[360px] p-0 shadow-lg"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-base">Thông báo</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary h-auto py-1 px-2"
              onClick={handleMarkAllAsRead}
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>

        <div className="max-h-[70vh] overflow-y-auto w-full custom-scrollbar">
          {status === "pending" ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <BellIcon className="h-10 w-10 text-slate-200 mb-3" />
              <p>Bạn không có thông báo nào.</p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-4 border-b last:border-0 cursor-pointer rounded-none flex items-start gap-4 transition-colors ${
                    !notification.is_read
                      ? "bg-slate-50 dark:bg-slate-900/50"
                      : ""
                  }`}
                  asChild
                >
                  <Link
                    href={
                      notification.type === "post_reply"
                        ? `/post/${notification.entity_id}`
                        : "#"
                    }
                    onClick={() => {
                      if (!notification.is_read) {
                        const fakeEvent = {
                          preventDefault: () => {},
                          stopPropagation: () => {},
                        } as React.MouseEvent;
                        handleMarkAsRead(fakeEvent, notification.id);
                      }
                      setIsOpen(false);
                    }}
                  >
                    <div className="relative shrink-0">
                      {notification.sender ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={notification.sender.avatar_url || BLANK_AVATAR}
                          />
                          <AvatarFallback>
                            {notification.sender.display_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Info className="h-5 w-5 text-slate-500" />
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5 border shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>

                    <div className="flex-1 space-y-1 overflow-hidden">
                      <p
                        className={`text-sm wrap-break-word ${!notification.is_read ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Inline Friend Request Actions */}
                      {notification.type === "friend" &&
                        !notification.is_read &&
                        notification.entity_id && (
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              className="h-7 text-xs px-3"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  const { respondToFriendRequest } =
                                    await import("@/app/actions/friendship");
                                  await respondToFriendRequest(
                                    notification.entity_id as string,
                                    true,
                                  );
                                  handleMarkAsRead(e, notification.id);
                                } catch (error) {
                                  console.error(error);
                                }
                              }}
                            >
                              Xác nhận
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-3"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  const { respondToFriendRequest } =
                                    await import("@/app/actions/friendship");
                                  await respondToFriendRequest(
                                    notification.entity_id as string,
                                    false,
                                  );
                                  handleMarkAsRead(e, notification.id);
                                } catch (error) {
                                  console.error(error);
                                }
                              }}
                            >
                              Xóa
                            </Button>
                          </div>
                        )}

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {notification.created_at
                            ? formatDistanceToNow(
                                new Date(notification.created_at),
                                {
                                  addSuffix: true,
                                  locale: vi,
                                },
                              )
                            : ""}
                        </span>
                        {!notification.is_read &&
                          notification.type !== "friend" && (
                            <button
                              onClick={(e) =>
                                handleMarkAsRead(e, notification.id)
                              }
                              className="h-2 w-2 rounded-full bg-primary"
                              title="Đánh dấu đã đọc"
                            />
                          )}
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}

              {hasNextPage && (
                <div ref={ref} className="p-4 flex justify-center items-center">
                  {isFetchingNextPage ? (
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
