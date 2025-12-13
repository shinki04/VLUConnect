"use client";

import { Tables } from "@repo/shared/types/database.types";
import { cn } from "@repo/ui/lib/utils";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback,useState } from "react";
import { toast } from "sonner";

import {
  ChatWindow,
  ConversationList,
  CreateConversationDialog,
} from "@/components/messaging";
import { useConversation,useConversations } from "@/hooks/useConversations";

interface MessagesClientProps {
  currentUser: Tables<"profiles">;
  initialFriends: Tables<"profiles">[];
}

/**
 * Main client component for the messages page
 * Split view: conversation list on left, active chat on right
 */
export function MessagesClient({
  currentUser,
  initialFriends,
}: MessagesClientProps) {
  const router = useRouter();
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch conversations
  const {
    conversations,
    isLoading: isLoadingConversations,
    createDirect,
    isCreatingDirect,
    createGroup,
    isCreatingGroup,
  } = useConversations();

  // Fetch active conversation details
  const { conversation: activeConversation, leave } = useConversation(
    activeConversationId || ""
  );

  // Handle selecting a conversation
  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  // Handle creating direct conversation
  const handleCreateDirect = useCallback(
    async (userId: string) => {
      try {
        const conv = await createDirect(userId);
        setActiveConversationId(conv.id);
        setIsCreateDialogOpen(false);
        toast.success("Đã tạo cuộc trò chuyện mới");
      } catch (error) {
        toast.error("Không thể tạo cuộc trò chuyện");
        throw error;
      }
    },
    [createDirect]
  );

  // Handle creating group conversation
  const handleCreateGroup = useCallback(
    async (name: string, memberIds: string[]) => {
      try {
        const conv = await createGroup({ name, memberIds });
        setActiveConversationId(conv.id);
        setIsCreateDialogOpen(false);
        toast.success("Đã tạo nhóm mới");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Không thể tạo nhóm";
        toast.error(errorMessage);
        throw error;
      }
    },
    [createGroup]
  );

  // Handle leaving conversation
  const handleLeave = useCallback(async () => {
    if (!activeConversationId) return;

    try {
      await leave();
      setActiveConversationId(null);
      toast.success("Đã rời khỏi nhóm");
    } catch (error) {
      toast.error("Không thể rời nhóm");
    }
  }, [activeConversationId, leave]);

  // Handle adding friend from chat banner
  const handleAddFriend = useCallback((userId: string) => {
    // This will be handled by the FriendButton component
    // For now, we can just navigate to profile
    router.push(`/profile/${userId}`);
  }, [router]);

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
          />
        </div>

        {/* Chat window - main area */}
        <div className={cn("flex-1", !activeConversationId && "hidden md:flex")}>
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              currentUserId={currentUser.id}
              currentUser={currentUser}
              onLeave={handleLeave}
              onAddFriend={handleAddFriend}
              className="w-full"
            />
          ) : (
            <EmptyState onNewConversation={() => setIsCreateDialogOpen(true)} />
          )}
        </div>
      </div>

      {/* Create conversation dialog */}
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
