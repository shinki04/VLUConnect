"use client";

import { BLANK_AVATAR, SearchedUser } from "@repo/shared/types/user";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Clock,
  MessageCircle,
  MoreHorizontal,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createOrGetDirectConversation } from "@/app/actions/messaging";
import {
  acceptRequestFromUser,
  cancelSentRequestToUser,
} from "@/app/actions/user_search";
import { useFriendship } from "@/hooks/useFriendship";
import { userSearchKeys } from "@/hooks/useUserSearch";

function UserCard({ user }: { user: SearchedUser }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { sendRequest, isSending, unfriend, isUnfriending } = useFriendship(user.id);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMessage = async () => {
    try {
      const conversation = await createOrGetDirectConversation(user.id);
      router.push(`/messages?conversationId=${conversation.id}`);
    } catch {
      toast.error("Không thể mở cuộc trò chuyện");
    }
  };

  const handleViewProfile = () => {
    router.push(`/profile/${user.slug || user.id}`);
  };

  const handleAction = async (
    actionFn: () => Promise<void>,
    successMsg: string,
  ) => {
    try {
      setIsProcessing(true);
      await actionFn();
      toast.success(successMsg);
      // Invalidate the search queries so UI updates immediately
      queryClient.invalidateQueries({ queryKey: userSearchKeys.all });
    } catch {
      toast.error("Đã xảy ra lỗi");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-shadow hover:shadow-md">
      <div className="flex flex-row items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
        <div
          className="relative shrink-0 cursor-pointer"
          onClick={handleViewProfile}
        >
          <Image
            src={user.avatar_url || BLANK_AVATAR}
            alt={user.display_name || user.username || "User"}
            width={64}
            height={64}
            className="rounded-full object-cover aspect-square"
          />
          {(user.global_role === "lecturer" || user.global_role === "admin") && (
            <div title="Giảng viên" className="absolute -bottom-1 -right-1">
              <BadgeCheck
                className="w-6 h-6 text-blue-500 bg-white dark:bg-slate-900 rounded-full"
                fill="currentColor"
                stroke="white"
              />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="font-semibold text-lg hover:underline cursor-pointer break-words"
            onClick={handleViewProfile}
          >
            {user.display_name || user.username}
          </div>
          <div className="text-sm text-muted-foreground break-words">
            {user.username}
          </div>
          {user.global_role && user.global_role !== "lecturer" && (
            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {user.global_role === "student" && "Sinh viên"}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
        {user.friendship_status === "friends" && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMessage}
              className="flex-1 sm:flex-none"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Nhắn tin
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 px-0"
                  disabled={isUnfriending || isProcessing}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-red-500 cursor-pointer"
                  onClick={() =>
                    handleAction(async () => unfriend(), "Đã hủy kết bạn")
                  }
                >
                  <X className="mr-2 h-4 w-4" /> Hủy kết bạn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {user.friendship_status === "none" && (
          <Button
            className="flex-1 sm:flex-none bg-mainred hover:bg-mainred-hover text-white"
            size="sm"
            onClick={() =>
              handleAction(async () => sendRequest(), "Đã gửi lời mời kết bạn")
            }
            disabled={isSending || isProcessing}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Kết bạn
          </Button>
        )}

        {user.friendship_status === "pending_sent" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 sm:flex-none text-muted-foreground font-medium"
                disabled={isProcessing}
              >
                <Clock className="h-4 w-4 mr-2" />
                Đã gửi lời mời
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-red-500 cursor-pointer"
                onClick={() =>
                  handleAction(
                    () => cancelSentRequestToUser(user.id),
                    "Đã hủy lời mời",
                  )
                }
              >
                <X className="mr-2 h-4 w-4" /> Hủy lời mời
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {user.friendship_status === "pending_received" && (
          <Button
            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
            size="sm"
            onClick={() =>
              handleAction(async () => {
                await acceptRequestFromUser(user.id);
              }, "Đã trở thành bạn bè")
            }
            disabled={isProcessing}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Chấp nhận
          </Button>
        )}
      </div>
    </div>
  );
}

export function UserList({ users, isLoading }: { users: SearchedUser[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse">
            <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 py-1">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="py-20 text-center border rounded-xl bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700">
        <h3 className="text-xl font-semibold mb-2">Không tìm thấy ai</h3>
        <p className="text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
