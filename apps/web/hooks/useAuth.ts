import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getCurrentUser,
  getUserProfile,
  updateProfileWithAvatar,
} from "@/app/actions/user";

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
      // Update profile cache
      // queryClient.setQueryData(["user"], (old: User | null) =>
      //   old ? { ...old, ...updatedProfile } : updatedProfile
      // );

      const { userId } = variables; // lấy userId từ input mutate
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
    onError: (error) => {
      console.error("Profile update error:", error);
    },
  });
}
