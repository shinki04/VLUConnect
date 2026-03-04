import { Separator } from "@repo/ui/components/separator";
import Link from "next/link";
import * as React from "react";

import { getTotalUnreadCount } from "@/app/actions/messaging";
import { getCurrentUser } from "@/app/actions/user";
import { JoinedGroupsList } from "@/components/groups/JoinedGroupsList";

import { AddPostButton } from "./AddPostButton";
import { SidebarNav } from "./SidebarNav";

export async function Sidebar() {
  const [unreadCount, currentUser] = await Promise.all([
    getTotalUnreadCount(),
    getCurrentUser().catch(() => null),
  ]);

  return (
    <aside className="hidden md:flex flex-col gap-6 sticky top-24 h-fit">
      <SidebarNav unreadCount={unreadCount} />
      <Separator />
      {currentUser && (
        <div className="px-4 flex flex-col gap-4">
          <AddPostButton currentUser={currentUser} />
          <JoinedGroupsList />
        </div>
      )}

      {/* Mini Footer */}
      <div className="px-4 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        <p>© 2026 VLUconnect.</p>
        <div className="flex gap-2 mt-1">
          <Link className="hover:underline" href="/privacy-policy">
            Chính sách bảo mật
          </Link>{" "}
          •
          <Link className="hover:underline" href="/terms-of-service">
            Điều khoản dịch vụ
          </Link>
        </div>
      </div>
    </aside>
  );
}
