"use client";

import { User } from "@repo/shared/types/user";
import { HomeIcon } from "@repo/ui/components/home";
import { MessageCircleIcon } from "@repo/ui/components/message-circle";
import { GroupsIcon } from "@repo/ui/components/user-group-icon";
import { UsersIcon } from "@repo/ui/components/users";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { AddPostButton } from "./AddPostButton";

export function MobileNav({
    currentUser,
    unreadCount = 0,
}: {
    currentUser: User | null;
    unreadCount?: number;
}) {
    const pathname = usePathname();

    const getLinkClasses = (path: string) => {
        const isActive =
            pathname === path || (path !== "/dashboard" && pathname.startsWith(path));

        return cn(
            "flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[10px] font-semibold transition-colors",
            isActive
                ? "text-mainred"
                : "text-slate-500 hover:text-mainred dark:text-slate-400"
        );
    };

    const getIconClasses = (path: string) => {
        const isActive =
            pathname === path || (path !== "/dashboard" && pathname.startsWith(path));
        return cn(
            "transition-colors h-6 w-6 stroke-[2]",
            isActive
                ? "text-mainred stroke-mainred"
                : "text-slate-500 dark:text-slate-400"
        );
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dashboard-sidebar border-t border-dashboard-border z-50 px-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <nav className="flex items-center justify-between h-16 relative">
                <Link className={getLinkClasses("/dashboard")} href="/dashboard">
                    <HomeIcon className={getIconClasses("/dashboard")} />
                    <span>Trang chủ</span>
                </Link>

                <Link href="/messages" className={getLinkClasses("/messages")}>
                    <div className="relative">
                        <MessageCircleIcon className={getIconClasses("/messages")} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-2 bg-mainred text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </div>
                    <span>Tin nhắn</span>
                </Link>

                {/* Center Add Post Button Placeholder */}
                <div className="flex-1 flex justify-center mt-[-30px]">
                    {currentUser && (
                        <AddPostButton currentUser={currentUser} isMobileNav />
                    )}
                </div>

                <Link href="/groups" className={getLinkClasses("/groups")}>
                    <GroupsIcon className={getIconClasses("/groups")} />
                    <span>Nhóm</span>
                </Link>

                <Link href="/friends" className={getLinkClasses("/friends")}>
                    <UsersIcon className={getIconClasses("/friends")} />
                    <span>Bạn bè</span>
                </Link>
            </nav>
        </div>
    );
}
