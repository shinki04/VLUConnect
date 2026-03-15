"use client";

import { BLANK_AVATAR } from "@repo/shared/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export interface UserCardProps {
  user: {
    id: string;
    slug?: string | null;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  };
  /** Default is "list" (compact row), "grid" is larger (used in UserList) */
  variant?: "list" | "grid";
  subtitle?: React.ReactNode;
  rightAction?: React.ReactNode;
  avatarAction?: React.ReactNode;
  className?: string;
}

export function UserCard({
  user,
  variant = "list",
  subtitle,
  rightAction,
  avatarAction,
  className = "",
}: UserCardProps) {
  const name = user.displayName || user.username || user.slug || "Unknown";
  const sub = subtitle !== undefined ? subtitle : `@${user.username || user.slug || user.id}`;
  const profileLink = `/profile/${user.slug || user.id}`;

  if (variant === "grid") {
    // Content for the left side
    const leftContent = (
      <>
        <div className="relative shrink-0">
          <Image
            src={user.avatarUrl || BLANK_AVATAR}
            alt={name}
            width={64}
            height={64}
            className="rounded-full object-cover aspect-square"
          />
          {avatarAction && (
            <div className="absolute -bottom-1 -right-1">
              {avatarAction}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-lg hover:underline wrap-break-word">
            {name}
          </div>
          {sub && (
            <div className="text-sm text-muted-foreground wrap-break-word">
              {sub}
            </div>
          )}
        </div>
      </>
    );

    return (
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-shadow hover:shadow-md ${className}`}
      >
        <Link
          href={profileLink}
          className="flex flex-row items-center gap-4 w-full sm:w-auto flex-1 min-w-0 cursor-pointer"
        >
          {leftContent}
        </Link>

        {rightAction && (
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
            {rightAction}
          </div>
        )}
      </div>
    );
  }

  // list variant
  const leftContentList = (
    <>
        <div className="relative shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.avatarUrl || BLANK_AVATAR} />
            <AvatarFallback>{name[0] || "?"}</AvatarFallback>
          </Avatar>
          {avatarAction && (
            <div className="absolute -bottom-1 -right-1">
              {avatarAction}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium sm:text-sm wrap-break-word truncate text-foreground">
            {name}
          </p>
          {sub && (
            <p className="text-sm text-muted-foreground wrap-break-word truncate">
              {sub}
            </p>
          )}
        </div>
    </>
  );

  return (
    <div
      className={`flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors border mb-2 last:mb-0 ${className}`}
    >
      <Link
        href={profileLink}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        {leftContentList}
      </Link>

      {rightAction && (
        <div className="flex items-center gap-2 wrap-break-word mx-1 shrink-0">
          {rightAction}
        </div>
      )}
    </div>
  );
}
