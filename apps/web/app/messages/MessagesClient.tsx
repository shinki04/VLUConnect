"use client";

import { Tables } from "@repo/shared/types/database.types";
import { ConversationWithDetails } from "@repo/shared/types/messaging";
import { MessageCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
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
  const conversationIdParam = searchParams.get("conversationId");

  // Derive active conversation ID from URL (primary source of truth) or initial prop
  const activeConversationId = useMemo(() => {
    return conversationIdParam || initialConversation?.id || null;
  }, [conversationIdParam, initialConversation?.id]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  // Optimistic active conversation ID for instant UI switch
  const [optimisticActiveId, setOptimisticActiveId] = useState<string | null>(null);

  // Use optimistic ID if set, otherwise URL-based ID
  const displayActiveId = optimisticActiveId || activeConversationId;

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
    activeConversationId: displayActiveId,
  });

  // Fetch active conversation details (Client Side)
  // We use the hook for realtime updates and consistent API
  // BUT we initialize query data with 'initialConversation' if matches!
  const { conversation: activeConversation, leave } = useConversation(
    displayActiveId || ""
  );
  
  // NOTE: optimization - we could hydrate the query cache with initialConversation here
  // but for simplicity we assume `initialConversation` is passed as fallback if hook is loading?
  // Actually, useConversation uses useQuery. We can't easily inject initialData conditionally without passing it to hook.
  // For now, let's rely on the fact that if we have initialConversation, we can render efficiently.
  // But `activeConversation` from hook might be undefined initially if cache empty.
  // Let's use `activeConversation || (activeConversationId === initialConversation?.id ? initialConversation : undefined)`?
  
  const displayConversation = activeConversation || (displayActiveId === initialConversation?.id ? initialConversation : null);
  // Check if we're in optimistic loading state (clicked but data not loaded yet)
  const isOptimisticLoading = optimisticActiveId !== null && optimisticActiveId !== activeConversationId;

  // Handle selecting a conversation - optimistic UI
  const handleSelectConversation = useCallback((id: string) => {
    // Update optimistic state IMMEDIATELY for instant UI switch
    setOptimisticActiveId(id);
    
    // URL is source of truth, router.push updates activeConversationId via useMemo
    router.push(`/messages?conversationId=${id}`);
    
    // Clear optimistic state once URL updates (useEffect)
  }, [router]);

  // Clear optimistic state when URL updates
  // useMemo(() => {
  //   if (activeConversationId && optimisticActiveId && activeConversationId === optimisticActiveId) {
  //     setOptimisticActiveId(null);
  //   }
  // }, [activeConversationId, optimisticActiveId]);

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
      // Clear URL param - this updates activeConversationId via useMemo
      router.push("/messages");
      toast.success("Đã rời khỏi nhóm");
    } catch (error) {
      toast.error("Không thể rời nhóm");
    }
  }, [activeConversationId, leave, router]);

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
            activeConversationId={displayActiveId || undefined}
            isLoading={isLoadingConversations}
            onSelectConversation={handleSelectConversation}
            onNewConversation={() => setIsCreateDialogOpen(true)}
            onMarkAsRead={markConversationAsRead}
          />
        </div>

        {/* Chat window - main area */}
        <div
          className={cn("flex-1", !displayActiveId && "hidden md:flex")}
        >
          {displayConversation && displayActiveId ? (
            <ChatWindow
              key={displayActiveId} // Force remount on change
              conversation={displayConversation}
              currentUserId={currentUser.id}
              currentUser={currentUser}
              isInitialLoading={isOptimisticLoading}
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
