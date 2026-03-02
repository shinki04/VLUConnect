"use client";

import { useState } from "react";

import { FilterState,UserFilters } from "@/components/friends/UserFilters";
import { UserList } from "@/components/friends/UserList";
import { useUserSearch } from "@/hooks/useUserSearch";

export default function FriendsPage() {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    role: "all",
    friendStatus: "all",
  });

  const { data: users, isLoading } = useUserSearch(
    filters.searchQuery,
    filters.role,
    filters.friendStatus,
  );

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tìm kiếm bạn bè</h1>
        <p className="text-muted-foreground">
          Khám phá và kết nối với giảng viên, sinh viên khác trong hệ thống.
        </p>
      </div>

      <UserFilters filters={filters} onFilterChange={setFilters} />

      <div className="mt-8">
        <UserList users={users || []} isLoading={isLoading} />
      </div>
    </div>
  );
}
