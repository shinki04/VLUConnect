"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BookmarkIcon } from "@repo/ui/components/bookmark";
import { HomeIcon } from "@repo/ui/components/home";
import { MessageCircleIcon } from "@repo/ui/components/message-circle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { GroupsIcon } from "@repo/ui/components/user-group-icon";
import { UsersIcon } from "@repo/ui/components/users";
import { cn } from "@repo/ui/lib/utils";

interface ChatNavSidebarProps {
  unreadCount?: number;
  className?: string;
}

export function ChatNavSidebar({
  unreadCount = 0,
  className,
}: ChatNavSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      icon: HomeIcon,
      label: "Trang chủ",
      isActive: pathname === "/dashboard",
    },
    {
      href: "/messages",
      icon: MessageCircleIcon,
      label: "Tin nhắn",
      isActive: pathname.startsWith("/messages"),
      badge: unreadCount,
    },
    {
      href: "/groups",
      icon: GroupsIcon,
      label: "Nhóm",
      isActive: pathname.startsWith("/groups"),
    },
    {
      href: "/friends",
      icon: UsersIcon,
      label: "Bạn bè",
      isActive: pathname.startsWith("/friends"),
    },
    {
      href: "/saved",
      icon: BookmarkIcon,
      label: "Đã lưu",
      isActive: pathname.startsWith("/saved"),
    },
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col items-center py-6 w-[80px] h-full shrink-0 border-r border-chat-border bg-chat-sidebar transition-colors",
        className,
      )}
    >
      <TooltipProvider delayDuration={150}>
        <nav className="flex flex-col items-center gap-4 w-full">
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 group",
                    item.isActive
                      ? "bg-primary/10 text-primary"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary",
                  )}
                >
                  <item.icon
                    className={cn(
                      "transition-colors",
                      item.isActive
                        ? "text-primary"
                        : "text-inherit group-hover:text-primary",
                    )}
                  />

                  {/* Unread Badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-chat-sidebar">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                <p className="font-medium text-sm">{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </TooltipProvider>
    </aside>
  );
}
