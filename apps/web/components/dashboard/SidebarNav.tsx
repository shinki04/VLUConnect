"use client";

import { BookmarkIcon } from "@repo/ui/components/bookmark";
import { HomeIcon } from "@repo/ui/components/home";
import { MessageCircleIcon } from "@repo/ui/components/message-circle";
import { GroupsIcon } from "@repo/ui/components/user-group-icon";
import { UsersIcon } from "@repo/ui/components/users";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Trang chủ", icon: HomeIcon },
  {
    path: "/messages",
    label: "Tin nhắn",
    icon: MessageCircleIcon,
    hasBadge: true,
  },
  { path: "/groups", label: "Nhóm", icon: GroupsIcon },
  { path: "/friends", label: "Bạn bè", icon: UsersIcon },
  { path: "/explore", label: "Khám phá", icon: SearchIcon },
  { path: "/saved", label: "Đã lưu", icon: BookmarkIcon },
];

export function SidebarNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  const getLinkClasses = (path: string) => {
    // Treat empty path as fundamentally inactive for now
    if (!path)
      return "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-mainred/10 dark:hover:bg-mainred-hover font-medium transition-colors group";

    const isActive =
      pathname === path || (path !== "/dashboard" && pathname.startsWith(path));
    if (isActive) {
      return "flex items-center gap-3 px-4 py-3 rounded-lg bg-mainred/30 text-mainred font-semibold transition-colors group";
    }
    return "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-mainred/10 dark:hover:bg-mainred-hover font-medium transition-colors group";
  };

  const getIconClasses = (path: string) => {
    if (!path)
      return "text-slate-500 dark:text-slate-400 group-hover:text-mainred transition-colors";
    const isActive =
      pathname === path || (path !== "/dashboard" && pathname.startsWith(path));
    return isActive
      ? "text-mainred"
      : "text-slate-500 dark:text-slate-400 group-hover:text-mainred transition-colors";
  };

  return (
    <nav className="flex flex-col gap-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={getLinkClasses(item.path)}
          >
            <Icon className={getIconClasses(item.path)} />
            <span className="text-base">{item.label}</span>
            {item.hasBadge && unreadCount > 0 && (
              <span className="ml-auto bg-mainred text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
