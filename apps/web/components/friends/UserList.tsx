"use client";

import { SearchedUser } from "@repo/shared/types/user";
import { Button } from "@repo/ui/components/button";
import { BadgeCheck, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createOrGetDirectConversation } from "@/app/actions/messaging";
import { UserCard as UserCardComponent } from "@/components/user-card";
import { useGetCurrentUser } from "@/hooks/useAuth";
import { FriendButton } from "@/components/friendship/FriendButton";

function UserCard({ user }: { user: SearchedUser }) {
  const router = useRouter();
  const { data: currentUser } = useGetCurrentUser();

  // Removed `isFriends` variable since the Message button should always be visible

  const handleMessage = async () => {
    try {
      const conversation = await createOrGetDirectConversation(user.id);
      router.push(`/messages/${conversation.id}`);
    } catch {
      toast.error("Không thể mở cuộc trò chuyện");
    }
  };

  const rightAction = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          handleMessage();
        }}
        className="flex-1 sm:flex-none"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Nhắn tin
      </Button>
      {currentUser && (
        <FriendButton
          targetUserId={user.id}
          currentUserId={currentUser.id}
          className="flex-1 sm:flex-none"
        />
      )}
    </>
  );

  const avatarAction =
    user.global_role === "lecturer" || user.global_role === "admin" ? (
      <div title="Giảng viên">
        <BadgeCheck
          className="w-6 h-6 text-blue-500 bg-white dark:bg-slate-900 rounded-full"
          fill="currentColor"
          stroke="white"
        />
      </div>
    ) : undefined;

  const subtitle = (
    <div className="wrap-break-word">
      <span className="block">{user.username}</span>
      {user.global_role && user.global_role !== "lecturer" && (
        <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {user.global_role === "student" && "Sinh viên"}
        </div>
      )}
    </div>
  );

  return (
    <UserCardComponent
      variant="grid"
      user={{
        id: user.id,
        slug: user.slug,
        displayName: user.display_name,
        username: user.username,
        avatarUrl: user.avatar_url,
      }}
      subtitle={subtitle}
      rightAction={rightAction}
      avatarAction={avatarAction}
    />
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
