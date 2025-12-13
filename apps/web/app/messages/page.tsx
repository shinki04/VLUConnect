import { redirect } from "next/navigation";

import { getFriends } from "@/app/actions/friendship";
import { getCurrentUser } from "@/app/actions/user";

import { MessagesClient } from "./MessagesClient";


export const metadata = {
  title: "Tin nhắn - Messages",
  description: "Nhắn tin với bạn bè và nhóm",
};

export default async function MessagesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Get friends list for creating new conversations
  const friends = await getFriends(currentUser.id);

  return <MessagesClient currentUser={currentUser} initialFriends={friends} />;
}
