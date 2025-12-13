"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface NavUserProps {
  displayName: string;
  roleLabel: string;
  avatarUrl?: string | null;
  profileHref: string;
  onSignOut: () => void;
}

export default function NavUser({
  displayName,
  roleLabel,
  avatarUrl,
  profileHref,
  onSignOut,
}: NavUserProps) {
  const name = displayName || "User";
  const initial = name[0]?.toUpperCase() ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full outline-none group">
        <div className="relative pt-4 mt-1 mx-2">
          <div className="absolute top-0 left-2 right-2 h-[1px] bg-white/20"></div>
          <div className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer hover:bg-white/10">
            <Avatar className="h-10 w-10 border-2 border-white/20 shrink-0 shadow-sm">
              <AvatarImage src={avatarUrl || ""} alt={name} className="object-cover" />
              <AvatarFallback className="text-[#37426F] bg-white font-bold text-sm">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start overflow-hidden text-left min-w-0 flex-1">
              <span className="text-[14px] font-bold truncate text-white leading-tight group-hover:text-white/90">
                {displayName}
              </span>
              <span className="text-[11px] truncate text-white/60 font-medium mt-0.5">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[230px] p-1.5 bg-[#37426F] border-none shadow-none text-white rounded-xl z-50"
        align="center"
        side="top"
        sideOffset={12}
      >
        <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg py-2.5 px-3 mb-1 border-none outline-none">
          <Link href={profileHref} className="flex items-center gap-3 w-full">
            <UserIcon className="w-4 h-4 text-white/80" strokeWidth={2} />
            <span className="font-medium text-[14px]">Trang cá nhân</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onSignOut}
          className="focus:bg-[#EF4444]/20 focus:text-[#EF4444] text-white/80 cursor-pointer rounded-lg py-2.5 px-3 hover:text-[#EF4444] border-none outline-none"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
          <span className="font-medium text-[14px] ml-3">Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
