"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addMemberToGroup,
  createGroupConversation,
  createOrGetDirectConversation,
  getConversation,
  getConversations,
  getDirectConversationFriendship,
  leaveConversation,
} from "@/app/actions/messaging";

// Query keys
export const conversationKeys = {
  all: ["conversations"] as const,
  list: () => [...conversationKeys.all, "list"] as const,
  detail: (id: string) => [...conversationKeys.all, "detail", id] as const,
  friendship: (id: string) =>
    [...conversationKeys.all, "friendship", id] as const,
};

/**
 * Hook for managing conversations list
 */
export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: conversationKeys.list(),
    queryFn: getConversations,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Create direct conversation
  const createDirectMutation = useMutation({
    mutationFn: createOrGetDirectConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });

  // Create group conversation
  const createGroupMutation = useMutation({
    mutationFn: ({
      name,
      memberIds,
    }: {
      name: string;
      memberIds: string[];
    }) => createGroupConversation(name, memberIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    createDirect: createDirectMutation.mutateAsync,
    isCreatingDirect: createDirectMutation.isPending,

    createGroup: createGroupMutation.mutateAsync,
    isCreatingGroup: createGroupMutation.isPending,
  };
}

/**
 * Hook for a single conversation with details
 */
export function useConversation(conversationId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: conversationKeys.detail(conversationId),
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId,
    staleTime: 60000, // 1 minute
  });

  // Add member to group
  const addMemberMutation = useMutation({
    mutationFn: (userId: string) => addMemberToGroup(conversationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
    },
  });

  // Leave conversation
  const leaveMutation = useMutation({
    mutationFn: () => leaveConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });

  return {
    conversation: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    addMember: addMemberMutation.mutateAsync,
    isAddingMember: addMemberMutation.isPending,
    addMemberError: addMemberMutation.error,

    leave: leaveMutation.mutateAsync,
    isLeaving: leaveMutation.isPending,
  };
}

/**
 * Hook to check friendship status in a direct conversation
 */
export function useConversationFriendship(conversationId: string) {
  return useQuery({
    queryKey: conversationKeys.friendship(conversationId),
    queryFn: () => getDirectConversationFriendship(conversationId),
    enabled: !!conversationId,
    staleTime: 60000, // 1 minute
  });
}
