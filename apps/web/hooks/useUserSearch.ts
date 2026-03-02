"use client";

import { useQuery } from "@tanstack/react-query";

import { searchUsersWithFriendship } from "@/app/actions/user_search";

export const userSearchKeys = {
  all: ["users", "search"] as const,
  list: (params: { query: string; role: string; status: string }) =>
    [...userSearchKeys.all, params] as const,
};

export function useUserSearch(
  searchQuery: string,
  roleFilter: string,
  friendStatusFilter: string
) {
  return useQuery({
    queryKey: userSearchKeys.list({
      query: searchQuery,
      role: roleFilter,
      status: friendStatusFilter,
    }),
    queryFn: () => searchUsersWithFriendship(searchQuery, roleFilter, friendStatusFilter),
    // prevent showing old stale list when changing filters
    staleTime: 60000,
  });
}
