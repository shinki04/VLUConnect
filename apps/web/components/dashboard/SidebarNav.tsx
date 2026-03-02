"use client";

import { BookmarkIcon } from "@repo/ui/components/bookmark";
import { HomeIcon } from "@repo/ui/components/home";
import { MessageCircleIcon } from "@repo/ui/components/message-circle";
import { GroupsIcon } from "@repo/ui/components/user-group-icon";
import { UsersIcon } from "@repo/ui/components/users";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

export function SidebarNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  const getLinkClasses = (path: string) => {
    // Treat empty path as fundamentally inactive for now
    if (!path) return "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-mainred-hover font-medium transition-colors group";
    
    const isActive = pathname === path || (path !== "/dashboard" && pathname.startsWith(path));
    if (isActive) {
      return "flex items-center gap-3 px-4 py-3 rounded-lg bg-mainred/10 text-mainred font-semibold transition-colors group";
    }
    return "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-mainred-hover font-medium transition-colors group";
  };

  const getIconClasses = (path: string) => {
    if (!path) return "text-slate-500 dark:text-slate-400 group-hover:text-mainred transition-colors";
    const isActive = pathname === path || (path !== "/dashboard" && pathname.startsWith(path));
    return isActive ? "text-mainred" : "text-slate-500 dark:text-slate-400 group-hover:text-mainred transition-colors";
  };

  return (
    <nav className="flex flex-col gap-2">
      <Link className={getLinkClasses("/dashboard")} href="/dashboard">
        <HomeIcon className={getIconClasses("/dashboard")} />
        <span className="text-base">Trang chủ</span>
      </Link>
      
      <Link href="/messages" className={getLinkClasses("/messages")}>
        <MessageCircleIcon className={getIconClasses("/messages")} />
        <span className="text-base">Tin nhắn</span>
        {unreadCount > 0 && (
          <span className="ml-auto bg-mainred text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
      
      <Link href="/groups" className={getLinkClasses("/groups")}>
        <GroupsIcon className={getIconClasses("/groups")} />
        <span className="text-base">Nhóm</span>
      </Link>
      
      <Link href="/friends" className={getLinkClasses("/friends")}>
        <UsersIcon className={getIconClasses("/friends")} />
        <span className="text-base">Bạn bè</span>
      </Link>
      
      <Link href="" className={getLinkClasses("")}>
        <BookmarkIcon className={getIconClasses("")} />
        <span className="text-base">Đã lưu</span>
      </Link>
    </nav>
  );
}
