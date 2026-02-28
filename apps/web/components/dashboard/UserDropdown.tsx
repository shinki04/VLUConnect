"use client";

import AlertDialog from "@repo/ui/components/AlertDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { ChevronsUpDown, LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLogout } from "@/hooks/useAuth";

import { ThemeSwitcher } from "../theme-switcher";

interface UserDropdownProps {
  avatarUrl: string;
  displayName?: string | null;
  slug?: string | null;
}

export function UserDropdown({
  avatarUrl,
  displayName,
  slug,
}: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  const router = useRouter();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 p-1 pr-3 transition-all">
            <div className="relative">
              <Image
                alt="Profile"
                className="h-9 w-9 rounded-full object-cover border border-slate-200"
                src={avatarUrl}
                width={36}
                height={36}
              />
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-[#2a1515]"></span>
            </div>
            <span className="text-sm font-semibold hidden lg:block text-slate-700 dark:text-slate-200">
              {displayName}
            </span>
            <ChevronsUpDown
              size={15}
              className="text-slate-400 hidden md:block"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push(`/profile/${slug}`)}>
              Trang cá nhân
            </DropdownMenuItem>
            <DropdownMenuItem>Post đang chờ</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ThemeSwitcher />
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <span className="w-full flex items-center gap-2 text-red-500 font-semibold">
                <LogOut className="text-red-500" />
                Đăng xuất
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Đăng xuất"
        description="Bạn có chắc chắn muốn đăng xuất?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        onConfirm={() => {
          setOpen(false);
          logout.mutate();
          router.push("/login");
        }}
      />
    </>
  );
}
