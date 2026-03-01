import { BookmarkIcon } from "@repo/ui/components/bookmark";
import { HomeIcon } from "@repo/ui/components/home";
import { MessageCircleIcon } from "@repo/ui/components/message-circle";
import { Separator } from "@repo/ui/components/separator";
import { GroupsIcon } from "@repo/ui/components/user-group-icon";
import { UsersIcon } from "@repo/ui/components/users";
import Link from "next/link";
import * as React from "react";

import { getTotalUnreadCount } from "@/app/actions/messaging";
import { getCurrentUser } from "@/app/actions/user";
import { JoinedGroupsList } from "@/components/groups/JoinedGroupsList";

import { AddPostButton } from "./AddPostButton";

export async function Sidebar() {
  const [unreadCount, currentUser] = await Promise.all([
    getTotalUnreadCount(),
    getCurrentUser().catch(() => null),
  ]);

  return (
    <aside className="hidden md:flex flex-col gap-6 sticky top-24 h-fit">
      <nav className="flex flex-col gap-2">
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-mainred/10 text-mainred font-semibold transition-colors"
          href="/dashboard"
        >
          <div className="flex items-center gap-2">
            <HomeIcon className="text-mainred" />
            <span className="text-base">Trang chủ</span>
          </div>
        </Link>
        <Link href="/messages">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-mainred-hover font-medium transition-colors">
            <MessageCircleIcon className="text-mainred" />
            <span className="text-base">Tin nhắn</span>

            {unreadCount > 0 && (
              <span className="ml-auto bg-mainred text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </Link>
        <Link href="/groups">
          <div className=" flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-mainred-hover font-medium transition-colors">
            <GroupsIcon className="text-mainred" />
            <span className="text-base">Nhóm</span>
          </div>
        </Link>
        <Link href="/friends">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-mainred-hover font-medium transition-colors">
            <UsersIcon className="text-mainred" />
            <span className="text-base">Bạn bè</span>
          </div>
        </Link>
        <Link href="">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-mainred-hover font-medium transition-colors">
            <BookmarkIcon className="text-mainred" />
            <span className="text-base">Đã lưu</span>
          </div>
        </Link>
        <Separator />
        {currentUser && (
          <div className="px-4 flex flex-col gap-4">
            <AddPostButton currentUser={currentUser} />
            <JoinedGroupsList />
          </div>
        )}

        {/* <Link
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-mainred-hover font-medium transition-colors group"
          href="/settings"
        >
          <span className="material-symbols-outlined group-hover:text-mainred transition-colors">
            settings
          </span>
          <span>Cài đặt</span>
        </Link> */}
      </nav>

      {/* Mini Footer */}
      <div className="px-4 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        <p>© 2023 Van Lang University.</p>
        <div className="flex gap-2 mt-1">
          <Link className="hover:underline" href="/dashboard">
            Điều khoản
          </Link>{" "}
          •
          <Link className="hover:underline" href="/dashboard">
            Quyền riêng tư
          </Link>
        </div>
      </div>
    </aside>
  );
}
