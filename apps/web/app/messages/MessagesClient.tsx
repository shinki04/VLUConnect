"use client";

import { Tables } from "@repo/shared/types/database.types";
import { ConversationWithDetails } from "@repo/shared/types/messaging";
import { MessageCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { MobileNav } from "@/components/dashboard/MobileNav";
import { ChatNavSidebar } from "@/components/messaging/ChatNavSidebar";
// import { ChatRightSidebar } from "@/components/messaging/ChatRightSidebar";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { ConversationList } from "@/components/messaging/ConversationList";
import { CreateConversationDialog } from "@/components/messaging/CreateConversationDialog";
import { useConversation, useConversations } from "@/hooks/useConversations";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { cn } from "@/lib/utils";

// ...

interface MessagesClientProps {
  currentUser: Tables<"profiles">;
  initialFriends: Tables<"profiles">[];
  initialConversation?: ConversationWithDetails | null;
}

/**
 * Main client component for the messages page
 * Split view: conversation list on left, active chat on right
 */
export function MessagesClient({
  currentUser,
  initialFriends,
  initialConversation,
}: MessagesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for active conversation ID (for shallow routing)
  // Initialize from URL param or initial prop
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(() => {
    const paramId = searchParams.get("conversationId");
    return paramId || initialConversation?.id || null;
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // Sync with browser back/forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const convId = params.get("conversationId");
      setActiveConversationId(convId || null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Display active ID is just the local state now (no need for optimistic layer)

  // Fetch conversations
  const {
    conversations,
    isLoading: isLoadingConversations,
    createDirect,
    isCreatingDirect,
    createGroup,
    isCreatingGroup,
  } = useConversations();

  // Global real-time notifications (messages, future: other notifications)
  const { markConversationAsRead } = useRealtimeNotifications({
    currentUserId: currentUser.id,
    activeConversationId,
  });

  const totalUnreadCount = conversations.reduce(
    (acc, conv) => acc + (conv.unreadCount || 0),
    0,
  );

  // Fetch active conversation details (Client Side)
  const {
    conversation: activeConversation,
    leave,
    isLoading: isLoadingConversation,
    isFetching: isFetchingConversation,
    error: conversationError,
    refetch: refetchConversation,
  } = useConversation(activeConversationId || "");

  // Debug logging
  // console.log("[MessagesClient] activeConversationId:", activeConversationId);
  // console.log("[MessagesClient] activeConversation:", activeConversation);
  // console.log("[MessagesClient] isLoadingConversation:", isLoadingConversation);
  // console.log(
  //   "[MessagesClient] isFetchingConversation:",
  //   isFetchingConversation,
  // );
  // console.log("[MessagesClient] conversationError:", conversationError);

  // Fallback to initial conversation if hook hasn't loaded yet
  const displayConversation =
    activeConversation ||
    (activeConversationId === initialConversation?.id
      ? initialConversation
      : null);

  // Handle selecting a conversation - shallow routing for instant switch
  const handleSelectConversation = useCallback((id: string) => {
    // Update local state IMMEDIATELY for instant UI switch
    setActiveConversationId(id);

    // Use shallow routing to avoid server-side re-render
    // This prevents Next.js from re-running page.tsx data fetching
    const url = `/messages?conversationId=${id}`;
    window.history.pushState({}, "", url);
  }, []);

  // Handle creating direct conversation
  const handleCreateDirect = useCallback(
    async (userId: string) => {
      try {
        const conv = await createDirect(userId);
        handleSelectConversation(conv.id);
        setIsCreateDialogOpen(false);
        toast.success("Đã tạo cuộc trò chuyện mới");
      } catch (error) {
        toast.error("Không thể tạo cuộc trò chuyện");
        throw error;
      }
    },
    [createDirect, handleSelectConversation],
  );

  // Handle creating group conversation
  const handleCreateGroup = useCallback(
    async (name: string, memberIds: string[]) => {
      try {
        const conv = await createGroup({ name, memberIds });
        handleSelectConversation(conv.id);
        setIsCreateDialogOpen(false);
        toast.success("Đã tạo nhóm mới");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Không thể tạo nhóm";
        toast.error(errorMessage);
        throw error;
      }
    },
    [createGroup, handleSelectConversation],
  );

  // ... rest of handlers ...
  // Handle leaving conversation
  const handleLeave = useCallback(async () => {
    if (!activeConversationId) return;

    try {
      await leave();
      // Clear active conversation and URL using shallow routing
      setActiveConversationId(null);
      window.history.pushState({}, "", "/messages");
      toast.success("Đã rời khỏi nhóm");
    } catch (error) {
      toast.error("Không thể rời nhóm");
    }
  }, [activeConversationId, leave]);

  // Handle adding friend from chat banner
  const handleAddFriend = useCallback(
    (userId: string) => {
      router.push(`/profile/${userId}`);
    },
    [router],
  );

  return (
    <div className="flex flex-col h-screen pb-[72px] md:pb-0">
      <div className="flex-1 overflow-hidden chat-layout rounded-none md:rounded-lg border-0 md:border shadow-sm">
        {/* Nav Sidebar */}
        <ChatNavSidebar unreadCount={totalUnreadCount} />

        {/* Conversation list - sidebar */}
        <div
          className={cn(
            "chat-sidebar",
            activeConversationId ? "hidden md:flex" : "flex",
          )}
        >
          <ConversationList
            conversations={conversations}
            currentUserId={currentUser.id}
            activeConversationId={activeConversationId || undefined}
            isLoading={isLoadingConversations}
            onSelectConversation={handleSelectConversation}
            onNewConversation={() => setIsCreateDialogOpen(true)}
            onMarkAsRead={markConversationAsRead}
          />
        </div>

        {/* Chat window - main area */}
        <div
          className={cn(
            "chat-panel",
            !activeConversationId && "hidden md:flex",
          )}
        >
          {activeConversationId ? (
            // Show loading only when actually fetching and no data yet
            isLoadingConversation ||
            (isFetchingConversation && !displayConversation) ? (
              <ChatWindowLoading />
            ) : displayConversation ? (
              <div className="flex flex-1 overflow-hidden relative">
                <ChatWindow
                  key={activeConversationId} // Force remount on change
                  conversation={displayConversation}
                  currentUserId={currentUser.id}
                  currentUser={currentUser}
                  isInitialLoading={false}
                  onLeave={handleLeave}
                  onAddFriend={handleAddFriend}
                  onBack={() => {
                    setActiveConversationId(null);
                    window.history.pushState({}, "", "/messages");
                  }}
                  className="flex-1 min-w-0"
                  onToggleRightSidebar={() =>
                    setIsRightSidebarOpen(!isRightSidebarOpen)
                  }
                />
                {/* <ChatRightSidebar
                  conversation={displayConversation}
                  currentUserId={currentUser.id}
                  isOpen={isRightSidebarOpen}
                  onClose={() => setIsRightSidebarOpen(false)}
                  onLeaveGroup={handleLeave}
                /> */}
              </div>
            ) : (
              // Fallback: show error or retry state
              <ChatWindowLoading />
            )
          ) : (
            <EmptyState onNewConversation={() => setIsCreateDialogOpen(true)} />
          )}
        </div>
      </div>

      {/* ... dialogs ... */}
      <CreateConversationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        friends={initialFriends}
        onCreateDirect={handleCreateDirect}
        onCreateGroup={handleCreateGroup}
        isCreating={isCreatingDirect || isCreatingGroup}
      />

      <MobileNav currentUser={currentUser} unreadCount={totalUnreadCount} />
    </div>
  );
}

/**
 * Empty state when no conversation is selected
 */
function EmptyState({ onNewConversation }: { onNewConversation: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-muted/20">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <MessageCircle className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Tin nhắn của bạn</h2>
      <p className="text-muted-foreground text-center max-w-[280px] mb-6">
        Chọn một cuộc trò chuyện hoặc bắt đầu cuộc trò chuyện mới
      </p>
      <button
        onClick={onNewConversation}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
      >
        Tin nhắn mới
      </button>
    </div>
  );
}

/**
 * Loading state when conversation is being fetched
 */
function ChatWindowLoading() {
  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-3 w-20 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex items-end gap-2",
              i % 2 === 0 ? "" : "flex-row-reverse"
            )}
          >
            {i % 2 === 0 && <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />}
            <div
              className={cn(
                "h-12 rounded-2xl bg-muted animate-pulse",
                i % 2 === 0 ? "w-48 rounded-bl-md" : "w-64 rounded-br-md"
              )}
            />
          </div>
        ))}
      </div>

      {/* Input skeleton */}
      <div className="p-4 border-t">
        <div className="h-10 w-full bg-muted animate-pulse rounded-full" />
      </div>
    </div>
  );
}
