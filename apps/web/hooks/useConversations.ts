"use client";

import { conversationKeys } from "@repo/shared/types/queryKeys";
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

// Re-export for backward compatibility
export { conversationKeys };

/**
 * Hook for managing conversations list
 */
export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: conversationKeys.list(),
    queryFn: getConversations,
    staleTime: 120000, // 2 minutes - prevents premature refetches that could overwrite optimistic updates
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
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
      // Also invalidate the detail query to ensure fresh fetch for the new conversation
      if (newConv?.id) {
        queryClient.invalidateQueries({ queryKey: conversationKeys.detail(newConv.id) });
      }
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
    isFetching: query.isFetching,
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
