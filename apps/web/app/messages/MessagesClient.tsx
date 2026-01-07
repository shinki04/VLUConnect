"use client";

import { Tables } from "@repo/shared/types/database.types";
import { ConversationWithDetails } from "@repo/shared/types/messaging";
import { MessageCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const paramId = searchParams.get("conversationId");
    return paramId || initialConversation?.id || null;
  });
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  // Fetch active conversation details (Client Side)
  const { conversation: activeConversation, leave } = useConversation(
    activeConversationId || ""
  );
  
  // Fallback to initial conversation if hook hasn't loaded yet
  const displayConversation = activeConversation || 
    (activeConversationId === initialConversation?.id ? initialConversation : null);

  // Handle selecting a conversation - shallow routing for instant switch
  const handleSelectConversation = useCallback((id: string) => {
    // Update local state IMMEDIATELY for instant UI switch
    setActiveConversationId(id);
    
    // Use shallow routing to avoid server-side re-render
    // This prevents Next.js from re-running page.tsx data fetching
    const url = `/messages?conversationId=${id}`;
    window.history.pushState({}, '', url);
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
    [createDirect, handleSelectConversation]
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
    [createGroup, handleSelectConversation]
  );

  // ... rest of handlers ...
  // Handle leaving conversation
  const handleLeave = useCallback(async () => {
    if (!activeConversationId) return;

    try {
      await leave();
      // Clear active conversation and URL using shallow routing
      setActiveConversationId(null);
      window.history.pushState({}, '', '/messages');
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
    [router]
  );

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-lg border bg-background shadow-sm">
        {/* Conversation list - sidebar */}
        <div
          className={cn(
            "w-full md:w-80 lg:w-96 border-r shrink-0",
            activeConversationId ? "hidden md:block" : "block"
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
          className={cn("flex-1", !activeConversationId && "hidden md:flex")}
        >
          {displayConversation && activeConversationId ? (
            <ChatWindow
              key={activeConversationId} // Force remount on change
              conversation={displayConversation}
              currentUserId={currentUser.id}
              currentUser={currentUser}
              isInitialLoading={false}
              onLeave={handleLeave}
              onAddFriend={handleAddFriend}
              className="w-full"
            />
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
    </>
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
