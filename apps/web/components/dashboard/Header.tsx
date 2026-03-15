import { BLANK_AVATAR } from "@repo/shared/types/user";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { getCurrentUser } from "@/app/actions/user";

import { FeedFilterTabs } from "./FeedFilterTabs";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserDropdown } from "./UserDropdown";

interface HeaderProps {
  hideNavTabs?: boolean;
  centerContent?: React.ReactNode;
  title?: string;
}

export async function Header({
  hideNavTabs,
  centerContent,
  title,
}: HeaderProps = {}) {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 bg-dashboard-sidebar border-b border-dashboard-border h-16 px-4 md:px-6 lg:px-10 flex items-center justify-between shadow-sm">
      {/* <div className="hidden md:flex items-center gap-4 w-1/4">
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
      </div> */}
      <div className="hidden md:flex items-center gap-4 w-1/4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-mainred"
        >
          <Image
            src="/logo_red_noname.png"
            alt="VLU Connect Logo"
            width={36}
            height={36}
            className="object-contain"
          />

          <div className="flex flex-col leading-none">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              VLU Connect
            </h1>

            <span className="text-[9px] uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider mt-[2px]">
              Trường Đại học Văn Lang
            </span>
          </div>
        </Link>
      </div>

      {centerContent || title ? (
        <div className="flex flex-col items-center flex-1 md:w-2/4 md:flex-initial max-w-2xl">
          {centerContent || (
            <h2 className="md:text-lg sm:text-sm  font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
          )}
        </div>
      ) : !hideNavTabs ? (
        <div className="flex flex-col items-center flex-1 md:w-2/4 md:flex-initial max-w-2xl">
          <React.Suspense fallback={<div className="h-7" />}>
            <FeedFilterTabs />
          </React.Suspense>
        </div>
      ) : (
        <div className="flex-1 text-center font-bold text-lg hidden md:block">
          Trang cá nhân
        </div>
      )}

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
