import { ConversationWithDetails } from "@repo/shared/types/messaging";
import { conversationKeys } from "@repo/shared/types/queryKeys";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";

import { getFriends } from "@/app/actions/friendship";
import { getConversation, getConversations } from "@/app/actions/messaging";
import { getCurrentUser } from "@/app/actions/user";

import { MessagesClient } from "./MessagesClient";

export const metadata = {
  title: "Tin nhắn - Messages",
  description: "Nhắn tin với bạn bè và nhóm",
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { conversationId?: string };
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const queryClient = new QueryClient();

  // Prefetch conversations list + friends in parallel
  // Messages are fetched CLIENT-SIDE with caching for instant switching
  const [friends] = await Promise.all([
    getFriends(currentUser.id),
    queryClient.prefetchQuery({
      queryKey: conversationKeys.list(),
      queryFn: getConversations,
    }),
  ]);

  // Only prefetch conversation detail (metadata, not messages)
  let initialConversation: ConversationWithDetails | null = null;
  
  if (params.conversationId) {
    try {
      await queryClient.prefetchQuery({
        queryKey: conversationKeys.detail(params.conversationId),
        queryFn: () => getConversation(params.conversationId!),
      });
      
      initialConversation = queryClient.getQueryData<ConversationWithDetails>(
        conversationKeys.detail(params.conversationId)
      ) ?? null;
    } catch (e) {
      console.error("Failed to load initial conversation", e);
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MessagesClient
        currentUser={currentUser}
        initialFriends={friends}
        initialConversation={initialConversation}
      />
    </HydrationBoundary>
  );
}

