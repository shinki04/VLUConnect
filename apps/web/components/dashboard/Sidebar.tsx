import Link from "next/link";
import * as React from "react";

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col gap-6 sticky top-24 h-fit">
      <nav className="flex flex-col gap-2">
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-mainred/10 text-mainred font-semibold transition-colors"
          href="/dashboard"
        >
          <span className="material-symbols-outlined filled">home</span>
          <span>Trang chủ</span>
        </Link>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors group"
          href="/messages"
        >
          <span className="material-symbols-outlined group-hover:text-mainred transition-colors">
            chat
          </span>
          <span>Tin nhắn</span>
          <span className="ml-auto bg-mainred text-white text-xs font-bold px-2 py-0.5 rounded-full">
            3
          </span>
        </Link>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors group"
          href="/dashboard"
        >
          <span className="material-symbols-outlined group-hover:text-mainred transition-colors">
            groups
          </span>
          <span>Nhóm</span>
        </Link>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors group"
          href="/dashboard"
        >
          <span className="material-symbols-outlined group-hover:text-mainred transition-colors">
            diversity_3
          </span>
          <span>Bạn bè</span>
        </Link>
        <div className="h-px bg-dashboard-border dark:bg-dashboard-darkBorder my-1 mx-4"></div>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors group"
          href="/dashboard"
        >
          <span className="material-symbols-outlined group-hover:text-mainred transition-colors">
            bookmark
          </span>
          <span>Đã lưu</span>
        </Link>
        <Link
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors group"
          href="/dashboard"
        >
          <span className="material-symbols-outlined group-hover:text-mainred transition-colors">
            settings
          </span>
          <span>Cài đặt</span>
        </Link>
      </nav>

      {/* Mini Footer */}
      <div className="px-4 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        <p>© 2023 Van Lang University.</p>
        <div className="flex gap-2 mt-1">
          <Link className="hover:underline" href="/dashboard">
            Điều khoản
          </Link>{" "}
          •
          <Link className="hover:underline" href="/dashboard">
            Quyền riêng tư
          </Link>
        </div>
      </div>
    </aside>
  );
}
