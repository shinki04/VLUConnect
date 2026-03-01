import Link from "next/link";
import React from "react";

import { getMyGroups } from "@/app/actions/group";

export async function JoinedGroupsList() {
  const myGroups = await getMyGroups();

  if (!myGroups || myGroups.length === 0) return null;

  const displayGroups = myGroups.slice(0, 5);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between px-3 mb-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nhóm của tôi</h3>
        <Link href="/groups" className="text-xs text-mainred hover:underline">
          Xem tất cả
        </Link>
      </div>
      <div className="flex flex-col gap-1">
        {displayGroups.map((group) => {
          const iconStr = group.name.substring(0, 2).toUpperCase();
          const avatarUrl = group.avatar_url;

          return (
            <Link
              key={group.id}
              href={`/groups/${group.slug}`}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={group.name}
                  className="w-8 h-8 rounded-lg object-cover border border-gray-100 dark:border-gray-800 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-mainred/10 text-mainred flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold">{iconStr}</span>
                </div>
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-mainred transition-colors">
                {group.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
