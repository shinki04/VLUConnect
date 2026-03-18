import { conversationKeys } from "@repo/shared/types/queryKeys";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";

import { getConversation } from "@/app/actions/messaging";
import { getCurrentUser } from "@/app/actions/user";

import { ChatWindowClient } from "./ChatWindowClient";

export default async function ConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const queryClient = new QueryClient();

  // Prefetch the specific conversation details
  try {
    await queryClient.prefetchQuery({
      queryKey: conversationKeys.detail(id),
      queryFn: () => getConversation(id),
    });
  } catch (e) {
    console.error("Failed to load conversation", e);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ChatWindowClient conversationId={id} currentUser={currentUser} />
    </HydrationBoundary>
  );
}
