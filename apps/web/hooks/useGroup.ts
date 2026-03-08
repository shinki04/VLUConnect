"use client";

import { useInfiniteQuery,useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  approveAllMembers,
  approveMember,
  checkIsGroupAdmin,
  getGroupMembers,
  getGroupPosts,
  rejectMember,
  removeMember,
  transferAdmin,
  updateMemberRole,
} from "@/app/actions/group";

// ============================================================
// Query Keys
// ============================================================

export const groupKeys = {
  all: ["groups"] as const,
  detail: (slug: string) => [...groupKeys.all, "detail", slug] as const,
  members: (groupId: string) => [...groupKeys.all, "members", groupId] as const,
  pendingMembers: (groupId: string) =>
    [...groupKeys.all, "pending", groupId] as const,
  posts: (groupId: string) => [...groupKeys.all, "posts", groupId] as const,
  suggested: () => [...groupKeys.all, "suggested"] as const,
  myGroups: () => [...groupKeys.all, "my"] as const,
};

// ============================================================
// Hooks
// ============================================================

import { GroupPrivacyFilter } from "@repo/shared/types/explore-groups";

import { getMyGroups as fetchMyGroups, getSuggestedGroups, searchGroups } from "@/app/actions/group";

export const exploreGroupKeys = {
  all: ["explore-groups"] as const,
  search: (query: string, privacy: string) => [...exploreGroupKeys.all, "search", query, privacy] as const,
};

export function useExploreGroups(query: string, privacy: GroupPrivacyFilter) {
  return useInfiniteQuery({
    queryKey: exploreGroupKeys.search(query, privacy),
    queryFn: async ({ pageParam = 1 }) => {
      const pageSize = 12;
      const result = await searchGroups(query, privacy, pageParam, pageSize);
      return {
        groups: result.groups,
        count: result.count,
        page: pageParam,
        hasNextPage: result.groups.length === pageSize,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNextPage) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 30000,
  });
}

/**
 * Hook to fetch suggested groups
 */
export function useSuggestedGroups() {
  return useQuery({
    queryKey: groupKeys.suggested(),
    queryFn: () => getSuggestedGroups(),
  });
}

/**
 * Hook to fetch my groups
 */
export function useMyGroups() {
  return useQuery({
    queryKey: groupKeys.myGroups(),
    queryFn: () => fetchMyGroups(),
  });
}

const POSTS_PER_PAGE = 10;

/**
 * Hook to fetch group posts with infinite scroll
 */
export function useInfiniteGroupPosts(groupId: string) {
  return useInfiniteQuery({
    queryKey: groupKeys.posts(groupId),
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getGroupPosts(groupId, pageParam, POSTS_PER_PAGE);
      return {
        posts: result.posts,
        count: result.count,
        page: pageParam,
        hasNextPage: result.posts.length === POSTS_PER_PAGE,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNextPage) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!groupId,
    staleTime: 30000,
  });
}

/**
 * Hook to invalidate group posts cache
 */
export function useInvalidateGroupPosts() {
  const queryClient = useQueryClient();
  
  return (groupId: string) => {
    queryClient.invalidateQueries({ queryKey: groupKeys.posts(groupId) });
  };
}

/**
 * Hook to fetch group members
 */
export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: () => getGroupMembers(groupId, { status: "active" }),
    enabled: !!groupId,
    staleTime: 5000,
  });
}

/**
 * Hook to fetch pending member requests
 */
export function usePendingMembers(groupId: string) {
  return useQuery({
    queryKey: groupKeys.pendingMembers(groupId),
    queryFn: () => getGroupMembers(groupId, { status: "pending" }),
    enabled: !!groupId,
    staleTime: 30000,
  });
}

/**
 * Hook for member management mutations
 */
export function useGroupMemberActions(groupId: string) {
  const queryClient = useQueryClient();

  const invalidateMembers = () => {
    queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
    queryClient.invalidateQueries({
      queryKey: groupKeys.pendingMembers(groupId),
    });
  };

  const updateRoleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: "sub_admin" | "moderator" | "member";
    }) => updateMemberRole(groupId, userId, role),
    onSuccess: (result) => {
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã cập nhật role");
        invalidateMembers();
      }
    },
    onError: () => toast.error("Lỗi khi cập nhật role"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(groupId, userId),
    onSuccess: (result) => {
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa thành viên");
        invalidateMembers();
      }
    },
    onError: () => toast.error("Lỗi khi xóa thành viên"),
  });

  const approveMemberMutation = useMutation({
    mutationFn: (userId: string) => approveMember(groupId, userId),
    onSuccess: (result) => {
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã duyệt thành viên");
        invalidateMembers();
      }
    },
    onError: () => toast.error("Lỗi khi duyệt thành viên"),
  });

  const rejectMemberMutation = useMutation({
    mutationFn: (userId: string) => rejectMember(groupId, userId),
    onSuccess: (result) => {
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã từ chối thành viên");
        invalidateMembers();
      }
    },
    onError: () => toast.error("Lỗi khi từ chối thành viên"),
  });

  const transferAdminMutation = useMutation({
    mutationFn: (newAdminId: string) => transferAdmin(groupId, newAdminId),
    onSuccess: (result) => {
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã chuyển quyền admin");
        invalidateMembers();
      }
    },
    onError: () => toast.error("Lỗi khi chuyển quyền admin"),
  });

  const approveAllMembersMutation = useMutation({
    mutationFn: () => approveAllMembers(groupId),
    onSuccess: (result) => {
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Đã duyệt ${result.approvedCount} thành viên`);
        invalidateMembers();
      }
    },
    onError: () => toast.error("Lỗi khi duyệt tất cả thành viên"),
  });

  return {
    updateRole: updateRoleMutation.mutate,
    isUpdatingRole: updateRoleMutation.isPending,

    removeMember: removeMemberMutation.mutate,
    isRemoving: removeMemberMutation.isPending,

    approveMember: approveMemberMutation.mutate,
    isApproving: approveMemberMutation.isPending,

    rejectMember: rejectMemberMutation.mutate,
    isRejecting: rejectMemberMutation.isPending,

    transferAdmin: transferAdminMutation.mutate,
    isTransferring: transferAdminMutation.isPending,

    approveAllMembers: approveAllMembersMutation.mutate,
    isApprovingAll: approveAllMembersMutation.isPending,
  };
}

/**
 * Hook to check if current user is admin/sub_admin/moderator of a group
 */
export function useIsGroupAdmin(groupId?: string) {
  return useQuery({
    queryKey: [...groupKeys.all, "isAdmin", groupId],
    queryFn: () => {
      if (!groupId) return false;
      return checkIsGroupAdmin(groupId);
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
