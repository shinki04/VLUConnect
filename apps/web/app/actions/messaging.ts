"use server";

import { Tables, TablesInsert } from "@repo/shared/types/database.types";
import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

// Types
export type Conversation = Tables<"conversations">;
export type ConversationMember = Tables<"conversation_members">;
export type Message = Tables<"messages">;

export type ConversationType = "direct" | "group";
export type MessageType = "text" | "image" | "file" | "system";

export interface ConversationWithDetails extends Conversation {
  members: (ConversationMember & {
    profile: Tables<"profiles">;
  })[];
  lastMessage?: Message & {
    sender?: Tables<"profiles">;
  };
  unreadCount?: number;
}

export interface MessageWithSender extends Message {
  sender?: Tables<"profiles">;
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get the current user's ID from auth
 */
async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Unauthorized");
  }

  return data.user.id;
}

/**
 * Check if two users are friends
 */
export async function areFriends(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`
    )
    .eq("status", "friends")
    .maybeSingle();

  if (error) {
    console.error("Error checking friendship:", error);
    return false;
  }

  return !!data;
}

// ============================================================
// Conversation Functions
// ============================================================

/**
 * Get all conversations for current user
 */
export async function getConversations(): Promise<ConversationWithDetails[]> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  // Get all conversation IDs for current user
  const { data: memberData, error: memberError } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", currentUserId);

  if (memberError) {
    console.error("Error fetching conversation memberships:", memberError);
    throw new Error("Failed to fetch conversations");
  }

  if (!memberData || memberData.length === 0) {
    return [];
  }

  const conversationIds = memberData.map((m) => m.conversation_id);

  // Get conversations with members and last message
  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .select(
      `
      *,
      members:conversation_members(
        *,
        profile:profiles(*)
      )
    `
    )
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false });

  if (convError) {
    console.error("Error fetching conversations:", convError);
    throw new Error("Failed to fetch conversations");
  }

  // Get last message for each conversation
  const conversationsWithMessages = await Promise.all(
    (conversations || []).map(async (conv) => {
      const { data: lastMessage } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:profiles(*)
        `
        )
        .eq("conversation_id", conv.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get unread count
      const currentMember = conv.members.find(
        (m: ConversationMember) => m.user_id === currentUserId
      );
      let unreadCount = 0;

      // Calculate unread: messages from others after last_read_at
      // If last_read_at is null, treat it as "never read" - count all messages from others
      let query = supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", currentUserId)
        .eq("is_deleted", false);

      if (currentMember?.last_read_at) {
        query = query.gt("created_at", currentMember.last_read_at);
      }

      const { count } = await query;
      unreadCount = count || 0;

      return {
        ...conv,
        lastMessage: lastMessage || undefined,
        unreadCount,
      } as ConversationWithDetails;
    })
  );

  return conversationsWithMessages;
}

/**
 * Get a single conversation by ID with members
 */
export async function getConversation(
  conversationId: string
): Promise<ConversationWithDetails | null> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  // Verify user is a member
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (!membership) {
    throw new Error("Not a member of this conversation");
  }

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      *,
      members:conversation_members(
        *,
        profile:profiles(*)
      )
    `
    )
    .eq("id", conversationId)
    .single();

  if (error) {
    console.error("Error fetching conversation:", error);
    return null;
  }

  return data as ConversationWithDetails;
}

/**
 * Create or get existing direct conversation
 */
export async function createOrGetDirectConversation(
  targetUserId: string
): Promise<Conversation> {
  const currentUserId = await getCurrentUserId();

  if (currentUserId === targetUserId) {
    throw new Error("Cannot create conversation with yourself");
  }

  const supabase = await createClient();

  // Check if direct conversation already exists between these users
  const { data: existingMembers } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", currentUserId);

  if (existingMembers && existingMembers.length > 0) {
    const convIds = existingMembers.map((m) => m.conversation_id);

    // Find conversation that has exactly both users and is direct type
    for (const convId of convIds) {
      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", convId)
        .eq("type", "direct")
        .single();

      if (conv) {
        const { data: members } = await supabase
          .from("conversation_members")
          .select("user_id")
          .eq("conversation_id", convId);

        if (
          members &&
          members.length === 2 &&
          members.some((m) => m.user_id === targetUserId)
        ) {
          return conv;
        }
      }
    }
  }

  // Create new direct conversation
  const { data: newConv, error: convError } = await supabase
    .from("conversations")
    .insert({
      type: "direct",
      created_by: currentUserId,
    })
    .select()
    .single();

  if (convError || !newConv) {
    console.error("Error creating conversation:", convError);
    throw new Error("Failed to create conversation");
  }

  // Add both members
  const { error: membersError } = await supabase
    .from("conversation_members")
    .insert([
      { conversation_id: newConv.id, user_id: currentUserId, role: "member" },
      { conversation_id: newConv.id, user_id: targetUserId, role: "member" },
    ]);

  if (membersError) {
    console.error("Error adding conversation members:", membersError);
    // Cleanup conversation
    await supabase.from("conversations").delete().eq("id", newConv.id);
    throw new Error("Failed to create conversation");
  }

  revalidatePath("/messages");
  return newConv;
}

/**
 * Create a group conversation (only with friends)
 */
export async function createGroupConversation(
  name: string,
  memberIds: string[]
): Promise<Conversation> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  if (!name.trim()) {
    throw new Error("Group name is required");
  }

  if (memberIds.length < 1) {
    throw new Error("At least one member is required");
  }

  // Validate all members are friends
  for (const memberId of memberIds) {
    const isFriend = await areFriends(currentUserId, memberId);
    if (!isFriend) {
      throw new Error("Can only add friends to group");
    }
  }

  // Create group conversation
  const { data: newConv, error: convError } = await supabase
    .from("conversations")
    .insert({
      type: "group",
      name: name.trim(),
      created_by: currentUserId,
    })
    .select()
    .single();

  if (convError || !newConv) {
    console.error("Error creating group:", convError);
    throw new Error("Failed to create group");
  }

  // Add members (creator is admin)
  const membersToInsert: TablesInsert<"conversation_members">[] = [
    { conversation_id: newConv.id, user_id: currentUserId, role: "admin" },
    ...memberIds.map((id) => ({
      conversation_id: newConv.id,
      user_id: id,
      role: "member",
    })),
  ];

  const { error: membersError } = await supabase
    .from("conversation_members")
    .insert(membersToInsert);

  if (membersError) {
    console.error("Error adding group members:", membersError);
    await supabase.from("conversations").delete().eq("id", newConv.id);
    throw new Error("Failed to create group");
  }

  revalidatePath("/messages");
  return newConv;
}

/**
 * Add a friend to a group conversation
 */
export async function addMemberToGroup(
  conversationId: string,
  userId: string
): Promise<void> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  // Check if conversation is a group
  const { data: conv } = await supabase
    .from("conversations")
    .select("type, created_by")
    .eq("id", conversationId)
    .single();

  if (!conv || conv.type !== "group") {
    throw new Error("Can only add members to groups");
  }

  // Check if current user is admin/creator
  const { data: currentMember } = await supabase
    .from("conversation_members")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId)
    .single();

  if (!currentMember || currentMember.role !== "admin") {
    throw new Error("Only admins can add members");
  }

  // Check if target is a friend
  const isFriend = await areFriends(currentUserId, userId);
  if (!isFriend) {
    throw new Error("Can only add friends to group");
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    throw new Error("User is already a member");
  }

  // Add member
  const { error } = await supabase.from("conversation_members").insert({
    conversation_id: conversationId,
    user_id: userId,
    role: "member",
  });

  if (error) {
    console.error("Error adding member:", error);
    throw new Error("Failed to add member");
  }

  revalidatePath(`/messages/${conversationId}`);
}

/**
 * Leave a conversation
 */
export async function leaveConversation(conversationId: string): Promise<void> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversation_members")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId);

  if (error) {
    console.error("Error leaving conversation:", error);
    throw new Error("Failed to leave conversation");
  }

  revalidatePath("/messages");
}

// ============================================================
// Message Functions
// ============================================================

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId: string,
  limit: number = 50,
  before?: string // cursor for pagination
): Promise<MessageWithSender[]> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  // Verify user is a member
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (!membership) {
    throw new Error("Not a member of this conversation");
  }

  // Optimized query: select only needed fields + reply_to for reply feature
  let query = supabase
    .from("messages")
    .select(
      `
      id,
      conversation_id,
      sender_id,
      content,
      message_type,
      created_at,
      updated_at,
      is_edited,
      is_deleted,
      media_urls,
      reply_to_id,
      sender:profiles!sender_id(*),
      reply_to:messages!reply_to_id(
        id,
        content,
        sender_id,
        is_deleted,
        sender:profiles!sender_id(*)
      )
    `
    )
    .eq("conversation_id", conversationId)
    // Don't filter is_deleted - show deleted messages with "thu hồi" status
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching messages:", error);
    throw new Error("Failed to fetch messages");
  }

  // Return in chronological order - cast is safe as we selected all required fields
  return (data || []).reverse() as MessageWithSender[];
}

/**
 * Send a message (optimized for minimal latency)
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  messageType: MessageType = "text",
  tempId?: string, // For optimistic UI matching
  replyToId?: string // For reply feature
): Promise<Message> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  if (!content.trim()) {
    throw new Error("Message content is required");
  }

  // Verify user is a member
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (!membership) {
    throw new Error("Not a member of this conversation");
  }

  // Insert message
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content.trim(),
      message_type: messageType,
      reply_to_id: replyToId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }

  // Update conversation's last_message_at
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data;
}

/**
 * Mark messages as read (update last_read_at)
 */
export async function markAsRead(conversationId: string): Promise<void> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId);

  if (error) {
    console.error("Error marking as read:", error);
    throw new Error(`Failed to mark as read: ${error.message}`);
  }
}

/**
 * Check friendship status for direct conversation
 */
export async function getDirectConversationFriendship(
  conversationId: string
): Promise<{ isFriends: boolean; otherUser: Tables<"profiles"> | null }> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  // Get conversation and verify it's direct
  const { data: conv } = await supabase
    .from("conversations")
    .select("type")
    .eq("id", conversationId)
    .single();

  if (!conv || conv.type !== "direct") {
    return { isFriends: true, otherUser: null }; // Groups don't show banner
  }

  // Get the other member
  const { data: members } = await supabase
    .from("conversation_members")
    .select(
      `
      user_id,
      profile:profiles(*)
    `
    )
    .eq("conversation_id", conversationId)
    .neq("user_id", currentUserId);

  if (!members || members.length === 0) {
    return { isFriends: true, otherUser: null };
  }

  const otherMember = members[0];
  if (!otherMember) {
    return { isFriends: true, otherUser: null };
  }

  const isFriends = await areFriends(currentUserId, otherMember.user_id);

  return {
    isFriends,
    otherUser: otherMember.profile as Tables<"profiles">,
  };
}

/**
 * Edit a message (only own messages)
 */
export async function editMessage(
  messageId: string,
  newContent: string
): Promise<Message> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  if (!newContent.trim()) {
    throw new Error("Nội dung tin nhắn không được để trống");
  }

  // Verify ownership
  const { data: message } = await supabase
    .from("messages")
    .select("sender_id, conversation_id")
    .eq("id", messageId)
    .single();

  if (!message || message.sender_id !== currentUserId) {
    throw new Error("Bạn chỉ có thể chỉnh sửa tin nhắn của mình");
  }

  // Update message
  const { data, error } = await supabase
    .from("messages")
    .update({
      content: newContent.trim(),
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .select()
    .single();

  if (error) {
    console.error("Error editing message:", error);
    throw new Error("Không thể chỉnh sửa tin nhắn");
  }

  return data;
}

/**
 * Recall/delete a message (soft delete, only own messages)
 */
export async function recallMessage(messageId: string): Promise<void> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  // Verify ownership
  const { data: message } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("id", messageId)
    .single();

  if (!message || message.sender_id !== currentUserId) {
    throw new Error("Bạn chỉ có thể thu hồi tin nhắn của mình");
  }

  // Soft delete - keep original content, only mark as deleted
  const { error } = await supabase
    .from("messages")
    .update({
      is_deleted: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId);

  if (error) {
    console.error("Error recalling message:", error);
    throw new Error("Không thể thu hồi tin nhắn");
  }
}
