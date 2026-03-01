import { GroupPrivacyFilter } from "@repo/shared/types/explore-groups";
import React from "react";

interface GroupFilterProps {
  currentFilter: GroupPrivacyFilter;
  onFilterChange: (filter: GroupPrivacyFilter) => void;
}

export function GroupFilter({
  currentFilter,
  onFilterChange,
}: GroupFilterProps) {
  return (
    <div className="group-filter flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
      <button
        onClick={() => onFilterChange("all")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap shadow-sm transition-colors ${
          currentFilter === "all"
            ? "bg-mainred text-white hover:bg-mainred-hover"
            : "bg-gray-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">globe</span>
        Tất cả
      </button>

      <button
        onClick={() => onFilterChange("public")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap shadow-sm transition-colors ${
          currentFilter === "public"
            ? "bg-mainred text-white hover:bg-mainred-hover"
            : "bg-gray-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">lock_open</span>
        Công khai
      </button>

      <button
        onClick={() => onFilterChange("private")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap shadow-sm transition-colors ${
          currentFilter === "private"
            ? "bg-mainred text-white hover:bg-mainred-hover"
            : "bg-gray-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">lock</span>
        Riêng tư
      </button>
    </div>
  );
}
