"use client";

import type { MessageWithSender } from "@repo/shared/types/messaging";
import { infiniteQueryOptions,useInfiniteQuery } from "@tanstack/react-query";

import { getMessages } from "@/app/actions/messaging";

const MESSAGES_PER_PAGE = 50;

/**
 * Query key factory for messages
 */
export const messagesKeys = {
  all: ["messages"] as const,
  conversation: (id: string) => [...messagesKeys.all, id] as const,
};

/**
 * Infinite query options for messages - can be used for both prefetching and hook
 */
export function messagesQueryOptions(conversationId: string) {
  return infiniteQueryOptions({
    queryKey: messagesKeys.conversation(conversationId),
    queryFn: async ({ pageParam }) => {
      const messages = await getMessages(
        conversationId,
        MESSAGES_PER_PAGE,
        pageParam
      );
      return messages;
    },
    // For reverse scroll: get cursor from oldest message
    getNextPageParam: (lastPage: MessageWithSender[]) => {
      if (lastPage.length < MESSAGES_PER_PAGE) {
        return undefined; // No more pages
      }
      // Return the created_at of the first (oldest) message as cursor
      return lastPage[0]?.created_at;
    },
    initialPageParam: undefined as string | undefined,
    // Instant loading: cache for 5 minutes, keep in memory for 30 minutes
    staleTime: 5 * 60 * 1000,  // 5 minutes - don't refetch within this time
    gcTime: 30 * 60 * 1000,     // 30 minutes - keep in cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for fetching messages with infinite scroll (reverse - load older on scroll up)
 * Uses placeholderData to show previous conversation data while fetching new one
 */
export function useMessagesQuery(conversationId: string, enabled = true) {
  return useInfiniteQuery({
    ...messagesQueryOptions(conversationId),
    enabled: enabled && !!conversationId,
    // Keep previous data while fetching new conversation - smoother transition
    placeholderData: (previousData) => previousData,
  });
}
