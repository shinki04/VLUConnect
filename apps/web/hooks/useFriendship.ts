"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  blockUser,
  cancelFriendRequest,
  getFriends,
  getFriendshipStatus,
  getPendingRequests,
  getSentRequests,
  respondToFriendRequest,
  sendFriendRequest,
  unblockUser,
  unfriend,
} from "@/app/actions/friendship";

// Query Keys
export const friendshipKeys = {
  all: ["friendships"] as const,
  status: (targetUserId: string) =>
    [...friendshipKeys.all, "status", targetUserId] as const,
  friends: (userId: string) =>
    [...friendshipKeys.all, "friends", userId] as const,
  pendingRequests: () => [...friendshipKeys.all, "pending"] as const,
  sentRequests: () => [...friendshipKeys.all, "sent"] as const,
};

// ============================================================
// Hooks
// ============================================================

/**
 * Hook to get and manage friendship status with a target user
 */
export function useFriendship(targetUserId: string) {
  const queryClient = useQueryClient();

  // Query friendship status
  const statusQuery = useQuery({
    queryKey: friendshipKeys.status(targetUserId),
    queryFn: () => getFriendshipStatus(targetUserId),
    enabled: !!targetUserId,
    staleTime: 30000, // 30 seconds
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: () => sendFriendRequest(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.status(targetUserId),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.sentRequests(),
      });
    },
  });

  // Respond to friend request mutation
  const respondMutation = useMutation({
    mutationFn: ({ friendshipId, accept }: { friendshipId: string; accept: boolean }) =>
      respondToFriendRequest(friendshipId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.status(targetUserId),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.pendingRequests(),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.all,
      });
    },
  });

  // Cancel sent request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: (friendshipId: string) => cancelFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.status(targetUserId),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.sentRequests(),
      });
    },
  });

  // Unfriend mutation
  const unfriendMutation = useMutation({
    mutationFn: () => unfriend(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.status(targetUserId),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.all,
      });
    },
  });

  // Block mutation
  const blockMutation = useMutation({
    mutationFn: () => blockUser(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.status(targetUserId),
      });
    },
  });

  // Unblock mutation
  const unblockMutation = useMutation({
    mutationFn: () => unblockUser(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.status(targetUserId),
      });
    },
  });

  return {
    // Status data
    status: statusQuery.data?.status ?? null,
    direction: statusQuery.data?.direction ?? null,
    friendship: statusQuery.data?.friendship ?? null,
    isLoading: statusQuery.isLoading,
    error: statusQuery.error,

    // Actions
    sendRequest: sendRequestMutation.mutate,
    isSending: sendRequestMutation.isPending,

    acceptRequest: (friendshipId: string) =>
      respondMutation.mutate({ friendshipId, accept: true }),
    rejectRequest: (friendshipId: string) =>
      respondMutation.mutate({ friendshipId, accept: false }),
    isResponding: respondMutation.isPending,

    cancelRequest: cancelRequestMutation.mutate,
    isCanceling: cancelRequestMutation.isPending,

    unfriend: unfriendMutation.mutate,
    isUnfriending: unfriendMutation.isPending,

    block: blockMutation.mutate,
    isBlocking: blockMutation.isPending,

    unblock: unblockMutation.mutate,
    isUnblocking: unblockMutation.isPending,
  };
}

/**
 * Hook to get friends list for a user
 */
export function useFriends(userId: string) {
  return useQuery({
    queryKey: friendshipKeys.friends(userId),
    queryFn: () => getFriends(userId),
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to get pending friend requests
 */
export function usePendingRequests() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: friendshipKeys.pendingRequests(),
    queryFn: getPendingRequests,
    staleTime: 30000, // 30 seconds
  });

  // Respond mutation for the list
  const respondMutation = useMutation({
    mutationFn: ({ friendshipId, accept }: { friendshipId: string; accept: boolean }) =>
      respondToFriendRequest(friendshipId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.pendingRequests(),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.all,
      });
    },
  });

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    accept: (friendshipId: string) =>
      respondMutation.mutate({ friendshipId, accept: true }),
    reject: (friendshipId: string) =>
      respondMutation.mutate({ friendshipId, accept: false }),
    isResponding: respondMutation.isPending,
  };
}

/**
 * Hook to get sent friend requests
 */
export function useSentRequests() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: friendshipKeys.sentRequests(),
    queryFn: getSentRequests,
    staleTime: 30000, // 30 seconds
  });

  const cancelMutation = useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.sentRequests(),
      });
    },
  });

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    cancel: cancelMutation.mutate,
    isCanceling: cancelMutation.isPending,
  };
}
