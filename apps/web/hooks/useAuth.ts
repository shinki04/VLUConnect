import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getCurrentUser,
  getUserProfile,
  updateProfileWithAvatar,
} from "@/app/actions/user";
import { signOut } from "@/app/auth/action";

export function useGetCurrentUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: () => getCurrentUser(),
    // placeholderData: (previousData) => previousData,
    staleTime: Infinity,
  });
}

export function useGetUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserProfile(id),
    placeholderData: (previousData) => previousData,
    staleTime: 1 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: FormData }) => {
      if (!userId) throw new Error("Missing user id");
      return updateProfileWithAvatar(userId, data);
    },
    onSuccess: (_data, variables) => {
      const { userId } = variables;
      // Remove stale cache so fresh data is fetched
      queryClient.removeQueries({ queryKey: ["user"] });
      queryClient.removeQueries({ queryKey: ["user", userId] });
      // Re-fetch
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
    onError: (error) => {
      console.error("Profile update error:", error);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

