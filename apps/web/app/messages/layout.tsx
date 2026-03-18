import { conversationKeys } from "@repo/shared/types/queryKeys";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";

import { getFriends } from "@/app/actions/friendship";
import { getConversations } from "@/app/actions/messaging";
import { getCurrentUser } from "@/app/actions/user";

import { MessagesLayoutClient } from "./MessagesLayoutClient";

export const metadata = {
  title: "Tin nhắn - Messages",
  description: "Nhắn tin với bạn bè và nhóm",
};

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MessagesLayoutClient currentUser={currentUser} initialFriends={friends}>
        {children}
      </MessagesLayoutClient>
    </HydrationBoundary>
  );
}
