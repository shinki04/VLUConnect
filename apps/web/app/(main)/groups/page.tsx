"use client";

import { GroupPrivacyFilter } from "@repo/shared/types/explore-groups";
import { useQueryClient } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { joinGroup } from "@/app/actions/group";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupCard } from "@/components/groups/GroupCard";
import { GroupFilter } from "@/components/groups/GroupFilter";
import { GroupSearchBar } from "@/components/groups/GroupSearchBar";
import { useExploreGroups } from "@/hooks/useGroup";

export default function ExploreGroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [privacyFilter, setPrivacyFilter] = useState<GroupPrivacyFilter>("all");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useExploreGroups(searchQuery, privacyFilter);

  const groups = data?.pages.flatMap((page) => page.groups) || [];

  const handleJoin = async (groupId: string) => {
    setJoiningId(groupId);
    try {
      const result = await joinGroup(groupId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          result.status === "active"
            ? "Đã tham gia nhóm thành công"
            : "Đã gửi yêu cầu tham gia nhóm",
        );
        // Invalidate to refresh membership status
        queryClient.invalidateQueries({ queryKey: ["explore-groups"] });
        queryClient.invalidateQueries({ queryKey: ["groups", "my"] });
      }
    } catch (e) {
      toast.error("Đã xảy ra lỗi khi tham gia nhóm");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="group-container flex flex-col gap-6 w-full h-full relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Khám phá Nhóm
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Tìm kiếm và tham gia các cộng đồng học thuật tại Văn Lang
          </p>
        </div>
        <div className="hidden md:flex">
          {/* <Button>
            <span className="flex items-center gap-2 justify-center">
              <Plus /> Tạo nhóm mới
            </span>
          </Button> */}
          <CreateGroupDialog />
        </div>
      </div>

      <div className="bg-dashboard-card p-4 rounded-xl shadow-sm border border-dashboard-border">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <GroupSearchBar onSearch={setSearchQuery} />
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2 hidden lg:block"></div>

          <div className="flex items-center gap-2">
            <GroupFilter
              currentFilter={privacyFilter}
              onFilterChange={setPrivacyFilter}
            />
            {/* <button
              className="hidden lg:flex items-center justify-center p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Lọc nâng cao"
            >
              <span className="material-symbols-outlined text-[20px]">
                tune
              </span>
            </button> */}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainred"></div>
        </div>
      ) : isError ? (
        <div className="w-full p-8 text-center text-red-500">
          Có lỗi xảy ra khi tải dữ liệu nhóm.
        </div>
      ) : groups.length === 0 ? (
        <div className="w-full p-12 text-center text-slate-500 bg-dashboard-sidebar rounded-xl border border-dashboard-border flex flex-col items-center justify-center gap-4">
          <SearchX />
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-200 text-lg">
              Không tìm thấy nhóm nào
            </p>
            <p className="text-sm">
              Vui lòng thử lại với từ khóa hoặc bộ lọc khác.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onJoin={handleJoin}
                isJoining={joiningId === group.id}
              />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center mt-2 mb-10 pb-8">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isFetchingNextPage ? "Đang tải..." : "Xem thêm nhóm"}
                {!isFetchingNextPage && (
                  <span className="material-symbols-outlined text-[18px]">
                    expand_more
                  </span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
