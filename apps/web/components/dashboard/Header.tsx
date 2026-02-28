"use client";

import { BLANK_AVATAR } from "@repo/shared/types/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Bell, ChevronsUpDown, LogOut, MessageCircleMore } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useGetCurrentUser } from "@/hooks/useAuth";

export function Header() {
  const { data: user } = useGetCurrentUser();
  return (
    <header className="sticky top-0 z-50 bg-dashboard-sidebar dark:bg-dashboard-darkSidebar border-b border-dashboard-border dark:border-dashboard-darkBorder h-16 px-4 md:px-6 lg:px-10 flex items-center justify-between shadow-sm">
      {/* Logo Area */}
      <div className="flex items-center gap-4 w-1/4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-mainred"
        >
          <span className="material-symbols-outlined text-4xl">school</span>
          <h1 className="text-xl font-bold tracking-tight hidden md:block text-slate-900 dark:text-slate-100">
            VLU <span className="text-mainred">Social</span>
          </h1>
        </Link>
      </div>

      {/* Central Search & Tabs */}
      <div className="flex flex-col items-center w-2/4 max-w-2xl">
        {/* <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400">search</span>
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2 border-none rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-mainred focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm"
            placeholder="Tìm kiếm giảng viên, sinh viên hoặc bài viết..."
            type="text"
          />
        </div> */}
        {/* Search Tabs (Quick Filters) */}
        <div className="flex gap-6 mt-1 text-sm font-medium">
          <a className="text-mainred border-b-2 border-mainred pb-0.5" href="#">
            Tất cả
          </a>
          <a
            className="text-slate-500 hover:text-mainred transition-colors pb-0.5"
            href="#"
          >
            Người dùng
          </a>
          <a
            className="text-slate-500 hover:text-mainred transition-colors pb-0.5"
            href="#"
          >
            Nhóm
          </a>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center justify-end gap-3 w-1/4">
        {/* Bell */}
        <button className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
          <span className="material-symbols-outlined">
            <Bell />
          </span>

          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mainred opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-mainred"></span>
          </span>
        </button>
        {/* Chat */}
        <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 hidden sm:block">
          <span className="material-symbols-outlined">
            <MessageCircleMore />
          </span>
        </button>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
        <UserDropdown
          avatarUrl={user?.avatar_url ?? BLANK_AVATAR}
          displayName={user?.display_name ?? undefined}
        />
      </div>
    </header>
  );
}

function UserDropdown({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string;
  displayName?: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 p-1 pr-3 transition-all">
          <div className="relative">
            <img
              alt="Profile"
              className="h-9 w-9 rounded-full object-cover border border-slate-200"
              src={avatarUrl}
            />
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-[#2a1515]"></span>
          </div>
          <span className="text-sm font-semibold hidden lg:block text-slate-700 dark:text-slate-200">
            {displayName}
          </span>
          <ChevronsUpDown size={15} className="text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Trang cá nhân</DropdownMenuLabel>
          <DropdownMenuItem>Post đang chờ</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <span className="w-full flex items-center gap-2 text-red-500">
              <LogOut className="text-red-500" />
              Đăng xuất
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
