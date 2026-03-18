"use client";

import { Tables } from "@repo/shared/types/database.types";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { ChatWindow } from "@/components/messaging/ChatWindow";
import { useConversation } from "@/hooks/useConversations";
import { cn } from "@/lib/utils";

export function ChatWindowClient({
  conversationId,
  currentUser,
}: {
  conversationId: string;
  currentUser: Tables<"profiles">;
}) {
  const router = useRouter();
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // Fetch active conversation details (Client Side)
  const {
    conversation: activeConversation,
    leave,
    isLoading,
    isFetching,
    error,
  } = useConversation(conversationId);

  // Handle leaving conversation
  const handleLeave = useCallback(async () => {
    try {
      await leave();
      toast.success("Đã rời khỏi nhóm");
      router.push("/messages");
    } catch (error) {
      toast.error("Không thể rời nhóm");
    }
  }, [leave, router]);

  // Handle adding friend from chat banner
  const handleAddFriend = useCallback(
    (userId: string) => {
      router.push(`/profile/${userId}`);
    },
    [router]
  );

  // If loading initially
  if ((isLoading || isFetching) && !activeConversation && !error) {
    return <ChatWindowLoading />;
  }

  // If no conversation found or error
  if (!activeConversation || error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-background text-muted-foreground p-4 text-center">
        <MessageCircle className="h-10 w-10 text-muted-foreground/50 mb-4" />
        <p>Cuộc trò chuyện này không tồn tại hoặc đã bị xóa.</p>
        <button
          onClick={() => router.push("/messages")}
          className="mt-4 px-4 py-2 border rounded-full hover:bg-muted transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden relative w-full h-full">
      <ChatWindow
        key={conversationId}
        conversation={activeConversation}
        currentUserId={currentUser.id}
        currentUser={currentUser}
        isInitialLoading={false}
        onLeave={handleLeave}
        onAddFriend={handleAddFriend}
        onBack={() => router.push("/messages")}
        className="flex-1 min-w-0"
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
      />
    </div>
  );
}

/**
 * Loading state when conversation is being fetched - matches ChatWindow layout
 */
function ChatWindowLoading() {
  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-chat-border bg-chat-bg/95 backdrop-blur z-10 transition-colors">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-full border-2 border-primary/10 shadow-sm bg-muted animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 relative overflow-hidden overflow-x-hidden">
        <div className="absolute inset-0 overflow-y-auto px-4 py-4">
          <div className="space-y-4 py-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-end gap-2",
                  i % 2 === 0 ? "" : "flex-row-reverse"
                )}
              >
                {i % 2 === 0 && (
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                )}
                <div
                  className={cn(
                    "h-12 rounded-2xl bg-muted animate-pulse",
                    i % 2 === 0 ? "w-48 rounded-bl-md" : "w-64 rounded-br-md"
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-end gap-2">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 h-12 bg-muted animate-pulse rounded-2xl" />
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
