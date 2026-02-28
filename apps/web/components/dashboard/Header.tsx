import { BLANK_AVATAR } from "@repo/shared/types/user";
import Link from "next/link";
import * as React from "react";

import { getCurrentUser } from "@/app/actions/user";

import { NotificationDropdown } from "./NotificationDropdown";
import { UserDropdown } from "./UserDropdown";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 bg-dashboard-sidebar border-b border-dashboard-border h-16 px-4 md:px-6 lg:px-10 flex items-center justify-between shadow-sm">
      <div className="hidden md:flex items-center gap-4 w-1/4">
        <div>
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
      </div>

      <div className="flex flex-col items-center flex-1 md:w-2/4 md:flex-initial max-w-2xl">
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
      <div className="flex items-center justify-end gap-2 md:gap-3 md:w-1/4">
        {/* Notifications */}
        <NotificationDropdown />

        {/* Chat */}
        {/* <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 hidden sm:block">
          <MessageCircleMore />
        </button> */}
        <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

        <UserDropdown
          avatarUrl={user?.avatar_url ?? BLANK_AVATAR}
          displayName={user?.display_name ?? undefined}
          slug={user?.slug ?? undefined}
        />
      </div>
    </header>
  );
}
