"use client";

import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Search } from "lucide-react";

export interface FilterState {
  searchQuery: string;
  role: string;
  friendStatus: string;
}

interface UserFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function UserFilters({ filters, onFilterChange }: UserFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên hiển thị, username..."
          className="pl-9 bg-background border-slate-200 dark:border-slate-800"
          value={filters.searchQuery}
          onChange={(e) =>
            onFilterChange({ ...filters, searchQuery: e.target.value })
          }
        />
      </div>

      <div className="flex gap-4 w-full md:w-auto">
        <Select
          value={filters.role}
          onValueChange={(val) => onFilterChange({ ...filters, role: val })}
        >
          <SelectTrigger className="w-full md:w-[180px] bg-background border-slate-200 dark:border-slate-800">
            <SelectValue placeholder="Chức vụ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chức vụ</SelectItem>
            <SelectItem value="lecturer">Giảng viên</SelectItem>
            <SelectItem value="student">Sinh viên</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.friendStatus}
          onValueChange={(val) =>
            onFilterChange({ ...filters, friendStatus: val })
          }
        >
          <SelectTrigger className="w-full md:w-[200px] bg-background border-slate-200 dark:border-slate-800">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="friends">Bạn bè</SelectItem>
            <SelectItem value="none">Người lạ</SelectItem>
            <SelectItem value="pending_sent">Đã gửi lời mời</SelectItem>
            <SelectItem value="pending_received">Chờ xác nhận</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
