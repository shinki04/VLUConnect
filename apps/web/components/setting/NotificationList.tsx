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
import { Button } from "@repo/ui/components/button";
import {
  CardContent,
} from "@repo/ui/components/card";
import { InfiniteData, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Bell,
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
import React, { useEffect, useMemo } from "react";
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
      return <Bell className="h-4 w-4 text-slate-500" />;
  }
}

function FriendRequestActionsWrapper({
  notification,
  handleMarkAsRead,
}: {
  notification: NotificationWithSender;
  handleMarkAsRead: (e: React.MouseEvent, id: string) => void;
}) {
  const { data: relationship } = useQuery({
    queryKey: ["friendship_status_dropdown", notification.sender_id],
    queryFn: async () => {
      if (!notification.sender_id) return null;
      const { getFriendshipStatus } = await import("@/app/actions/friendship");
      return getFriendshipStatus(notification.sender_id);
    },
    enabled: !!notification.sender_id,
  });

  if (relationship?.status === "friends") return null;

  return (
    <div className="flex items-center gap-2 mt-3">
      <Button
        size="sm"
        className="h-8 text-xs px-4"
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
        className="h-8 text-xs px-4"
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
  );
}

export function NotificationList() {
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
    const setupRealtime = async () => {
      if (!user) return;

      const channel = supabase
        .channel(`public:notifications:recipient_id=eq.${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          () => {
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
  }, [queryClient, user]);

  const notifications = useMemo(() => {
    return data?.pages.flatMap((page) => page.notifications) || [];
  }, [data]);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
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
      refetch();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
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

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  return (
    <div className="max-w-4xl mx-auto w-full pt-4">
      <div className="flex flex-col w-full border-none shadow-none md:border-solid bg-transparent md:bg-dashboard-card dark:md:bg-dashboard-darkCard overflow-hidden">
        <div className="flex flex-row items-center justify-between p-4 md:px-8 border-b border-dashboard-border space-y-0">
          <h1 className="text-xl md:text-2xl font-bold">Thông báo của bạn</h1>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-primary hover:text-mainred transition-colors shrink-0"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Đánh dấu tất cả đã đọc</span>
              <span className="sm:hidden">Đã đọc tất cả</span>
            </Button>
          )}
        </div>

        <CardContent className="flex flex-col w-full min-h-[40vh] p-0">
          {status === "pending" ? (
            <div className="p-12 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <Bell className="h-12 w-12 text-slate-200 dark:text-slate-800 mb-4" />
              <p className="text-lg">Bạn không có thông báo nào.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-dashboard-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`w-full transition-colors relative group ${
                    !notification.is_read
                      ? "bg-slate-50 dark:bg-slate-800/50"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  }`}
                >
                  <Link
                    href={
                      notification.type === "post_reply" ||
                      (notification.type === "comment" &&
                        notification.entity_type === "post_comment")
                        ? `/post/${notification.entity_id}`
                        : notification.type === "like" &&
                            notification.entity_type === "comment"
                          ? `/post/${(notification.metadata as { post_id?: string })?.post_id}`
                          : notification.type === "like" &&
                              notification.entity_type === "post_like"
                            ? `/post/${notification.entity_id}`
                            : "#"
                    }
                    onClick={(e) => {
                      if (!notification.is_read) {
                        handleMarkAsRead(e, notification.id);
                      }
                    }}
                    className="flex items-start gap-4 p-4 md:px-8"
                  >
                    <div className="relative shrink-0 mt-1">
                      {notification.sender && notification.type !== "system" ? (
                        <Avatar className="h-12 w-12 border border-slate-200 dark:border-slate-800">
                          <AvatarImage
                            src={notification.sender.avatar_url || BLANK_AVATAR}
                          />
                          <AvatarFallback>
                            {notification.sender.display_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          <Info className="h-6 w-6 text-slate-500" />
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-1 border shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>

                    <div className="flex-1 space-y-1">
                      <p
                        className={`text-base ${
                          !notification.is_read
                            ? "font-semibold text-slate-900 dark:text-slate-100"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {notification.message}
                      </p>

                      {notification.type === "friend" &&
                        !notification.is_read &&
                        notification.entity_id && (
                          <div onClick={(e) => e.preventDefault()}>
                            <FriendRequestActionsWrapper
                              notification={notification}
                              handleMarkAsRead={handleMarkAsRead}
                            />
                          </div>
                        )}

                      <div className="mt-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <span>
                          {notification.created_at
                            ? formatDistanceToNow(
                                new Date(notification.created_at),
                                { addSuffix: true, locale: vi },
                              )
                            : ""}
                        </span>
                        {!notification.is_read &&
                          notification.type !== "friend" && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                              <button
                                onClick={(e) =>
                                  handleMarkAsRead(e, notification.id)
                                }
                                className="text-primary hover:text-mainred transition-colors"
                              >
                                Đánh dấu đã đọc
                              </button>
                            </>
                          )}
                      </div>
                    </div>

                    {!notification.is_read && (
                      <div className="shrink-0 flex items-center h-full pt-4">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      </div>
                    )}
                  </Link>
                </div>
              ))}

              {hasNextPage && (
                <div ref={ref} className="p-8 flex justify-center items-center">
                  {isFetchingNextPage ? (
                    <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  ) : null}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}
