"use client";

import type { User } from "@repo/shared/types/user";
import {
  Bell,
  Home,
  MessageCircle,
  PlusSquare,
  Search,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import NavUser from "@/components/nav-user";
import { useDashboard } from "@/components/providers/DashboardProvider";

interface AppSidebarProps {
  currentUser: User | null;
  onSignOut: () => void;
}

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  icon: any;
  label: string;
  href?: string;
  onClick?: () => void;
}) => {
  const pathname = usePathname();
  const isActive = href ? pathname === href : false;

  const content = (
    <div
      className={`
        flex items-center gap-4 px-6 py-3.5 mx-3 mb-1 rounded-[14px] cursor-pointer 
        transition-all duration-200 font-bold
        ${
          isActive
            ? "bg-[#EF4444] text-white shadow-lg shadow-red-900/30"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        }
      `}
    >
      <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[15px] tracking-wide">{label}</span>
    </div>
  );

  if (href)
    return (
      <Link href={href} className="block w-full">
        {content}
      </Link>
    );
  return (
    <button onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  );
};

export default function AppSidebar({
  currentUser,
  onSignOut,
}: AppSidebarProps) {
  const { openAddPost } = useDashboard();

  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-[#37426F] h-screen fixed left-0 top-0 z-30 ...">
      {/* Logo */}
      <div className="flex flex-col items-center pt-10 pb-6">
        <div className="w-20 h-20 relative mb-2 flex items-center justify-center">
          <Image
            src="/logo_white.png"
            alt="VLUConnect"
            width={80}
            height={80}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-white font-bold text-xl tracking-wide uppercase">
          VLUConnect
        </h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1 w-full px-0 mt-2 overflow-y-auto no-scrollbar">
        <SidebarItem icon={Home} label="Trang chủ" href="/dashboard" />
        <SidebarItem
          icon={Users}
          label="Cộng đồng"
          href="/dashboard/community"
        />
        <SidebarItem icon={Search} label="Tìm kiếm" href="/dashboard/search" />
        <SidebarItem icon={MessageCircle} label="Trò chuyện" href="/messages" />
        <SidebarItem
          icon={Bell}
          label="Thông báo"
          href="/dashboard/notifications"
        />
        <SidebarItem
          icon={PlusSquare}
          label="Thêm bài viết"
          onClick={openAddPost}
        />
      </nav>

      {/* Footer User */}
      <div className="mt-auto w-full pb-6 px-3">
        <NavUser
          displayName={currentUser?.display_name || "User"}
          roleLabel="Sinh viên"
          avatarUrl={currentUser?.avatar_url}
          profileHref={currentUser?.id ? `/profile/${currentUser.id}` : "#"}
          onSignOut={onSignOut}
        />
      </div>
    </aside>
  );
}
