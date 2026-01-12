"use server";

import { Tables } from "@repo/shared/types/database.types";
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

  // Use RPC function to fetch all data in a single query
  // This avoids the N+1 problem where we were making 2 queries per conversation
  const { data, error } = await supabase.rpc(
    "get_conversations_with_details",
    { p_user_id: currentUserId }
  );

  if (error) {
    console.error("Error fetching conversations:", error);
    throw new Error("Failed to fetch conversations");
  }

  // The RPC returns data in the correct structure, just need to cast it
  return (data as unknown) as ConversationWithDetails[];
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

  // Add members (creator is admin) - Insert Creator FIRST to establish admin rights for RLS
  const { error: adminError } = await supabase
    .from("conversation_members")
    .insert({
      conversation_id: newConv.id,
      user_id: currentUserId,
      role: "admin"
    });

  if (adminError) {
    console.error("Error adding admin:", adminError);
    await supabase.from("conversations").delete().eq("id", newConv.id);
    throw new Error("Failed to create group");
  }

  // Insert other members
  if (memberIds.length > 0) {
    const otherMembers = memberIds.map((id) => ({
      conversation_id: newConv.id,
      user_id: id,
      role: "member" as const,
    }));

    const { error: membersError } = await supabase
      .from("conversation_members")
      .insert(otherMembers);

    if (membersError) {
      console.error("Error adding group members:", membersError);
      // Optional: Clean up? Or just return partial success?
      // For now, fail hard to ensure consistency, but realize admin is already in.
      // Ideally we would wrap this in a transaction if Supabase client supported it easily,
      // but splitting is necessary for RLS.
      // We will try to delete the conversation if this fails.
      await supabase.from("conversations").delete().eq("id", newConv.id);
      throw new Error("Failed to add members to group");
    }
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
// Group Management Functions
// ============================================================

export type MemberRole = "admin" | "sub_admin" | "moderator" | "member";

/**
 * Remove a member from a group conversation (admin/sub_admin only)
 */
export async function removeMemberFromGroup(
  conversationId: string,
  userId: string
): Promise<void> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  // Cannot remove yourself - use leaveConversation instead
  if (userId === currentUserId) {
    throw new Error("Không thể xóa bản thân. Hãy sử dụng chức năng rời nhóm.");
  }

  // Check if conversation is a group
  const { data: conv } = await supabase
    .from("conversations")
    .select("type")
    .eq("id", conversationId)
    .single();

  if (!conv || conv.type !== "group") {
    throw new Error("Chỉ có thể xóa thành viên khỏi nhóm");
  }

  // Check if current user is admin/sub_admin
  const { data: currentMember } = await supabase
    .from("conversation_members")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId)
    .single();

  if (!currentMember || !["admin", "sub_admin"].includes(currentMember.role || "")) {
    throw new Error("Chỉ quản trị viên mới có thể xóa thành viên");
  }

  // Check target member exists and their role
  const { data: targetMember } = await supabase
    .from("conversation_members")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single();

  if (!targetMember) {
    throw new Error("Thành viên không tồn tại trong nhóm");
  }

  // Sub-admin cannot remove admin
  if (currentMember.role === "sub_admin" && targetMember.role === "admin") {
    throw new Error("Phó quản trị không thể xóa quản trị viên chính");
  }

  // Remove the member
  const { error } = await supabase
    .from("conversation_members")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing member:", error);
    throw new Error("Không thể xóa thành viên");
  }

  revalidatePath(`/messages/${conversationId}`);
}

/**
 * Transfer admin role to another member (admin only)
 */
export async function transferAdmin(
  conversationId: string,
  newAdminId: string
): Promise<void> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  if (newAdminId === currentUserId) {
    throw new Error("Bạn đã là quản trị viên");
  }

  // Verify current user is admin
  const { data: currentMember } = await supabase
    .from("conversation_members")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId)
    .single();

  if (!currentMember || currentMember.role !== "admin") {
    throw new Error("Chỉ quản trị viên chính mới có thể chuyển quyền");
  }

  // Verify target is a member
  const { data: targetMember } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", newAdminId)
    .single();

  if (!targetMember) {
    throw new Error("Người dùng không phải thành viên của nhóm");
  }

  // Update new admin's role
  const { error: newAdminError } = await supabase
    .from("conversation_members")
    .update({ role: "admin" })
    .eq("conversation_id", conversationId)
    .eq("user_id", newAdminId);

  if (newAdminError) {
    console.error("Error setting new admin:", newAdminError);
    throw new Error("Không thể chuyển quyền quản trị");
  }

  // Downgrade current admin to member
  const { error: oldAdminError } = await supabase
    .from("conversation_members")
    .update({ role: "member" })
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId);

  if (oldAdminError) {
    console.error("Error downgrading old admin:", oldAdminError);
    // Try to rollback
    await supabase
      .from("conversation_members")
      .update({ role: "admin" })
      .eq("conversation_id", conversationId)
      .eq("user_id", currentUserId);
    throw new Error("Không thể chuyển quyền quản trị");
  }

  revalidatePath(`/messages/${conversationId}`);
}

/**
 * Update a member's role (admin/sub_admin only)
 */
export async function updateMemberRole(
  conversationId: string,
  userId: string,
  newRole: MemberRole
): Promise<void> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  // Cannot change own role
  if (userId === currentUserId) {
    throw new Error("Không thể thay đổi vai trò của bản thân");
  }

  // Validate role
  const validRoles: MemberRole[] = ["sub_admin", "moderator", "member"];
  if (!validRoles.includes(newRole)) {
    throw new Error("Vai trò không hợp lệ. Sử dụng transferAdmin để chuyển quyền admin.");
  }

  // Check current user's role
  const { data: currentMember } = await supabase
    .from("conversation_members")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId)
    .single();

  if (!currentMember || !["admin", "sub_admin"].includes(currentMember.role || "")) {
    throw new Error("Chỉ quản trị viên mới có thể thay đổi vai trò");
  }

  // Check target member
  const { data: targetMember } = await supabase
    .from("conversation_members")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single();

  if (!targetMember) {
    throw new Error("Thành viên không tồn tại trong nhóm");
  }

  // Sub-admin cannot change admin's role
  if (currentMember.role === "sub_admin" && targetMember.role === "admin") {
    throw new Error("Phó quản trị không thể thay đổi vai trò của quản trị viên");
  }

  // Sub-admin cannot promote to sub_admin
  if (currentMember.role === "sub_admin" && newRole === "sub_admin") {
    throw new Error("Chỉ quản trị viên chính mới có thể bổ nhiệm phó quản trị");
  }

  // Update role
  const { error } = await supabase
    .from("conversation_members")
    .update({ role: newRole })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating role:", error);
    throw new Error("Không thể thay đổi vai trò");
  }

  revalidatePath(`/messages/${conversationId}`);
}

// Media item type for getConversationMedia
export interface ConversationMediaItem {
  id: string;
  messageId: string;
  url: string;
  signedUrl: string;
  fileName: string;
  fileType: "image" | "video" | "file";
  senderId: string | null;
  senderName: string | null;
  senderAvatar: string | null;
  createdAt: string | null;
}

/**
 * Get all media shared in a conversation with signed URLs
 */
export async function getConversationMedia(
  conversationId: string,
  limit: number = 50,
  before?: string
): Promise<{ items: ConversationMediaItem[]; hasMore: boolean }> {
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
    throw new Error("Bạn không phải thành viên của cuộc trò chuyện này");
  }

  // Build query for messages with media
  let query = supabase
    .from("messages")
    .select(`
      id,
      media_urls,
      message_type,
      created_at,
      sender_id,
      sender:profiles!sender_id(display_name, username, avatar_url)
    `)
    .eq("conversation_id", conversationId)
    .not("media_urls", "is", null)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit + 1); // +1 to check if there are more

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages, error } = await query;

  if (error) {
    console.error("Error fetching media:", error);
    throw new Error("Không thể tải media");
  }

  if (!messages || messages.length === 0) {
    return { items: [], hasMore: false };
  }

  // Check if there are more items
  const hasMore = messages.length > limit;
  const messagesToProcess = hasMore ? messages.slice(0, limit) : messages;

  // Extract all file paths from media_urls
  const allPaths: { path: string; messageId: string; message: typeof messagesToProcess[0] }[] = [];

  for (const msg of messagesToProcess) {
    if (msg.media_urls && Array.isArray(msg.media_urls)) {
      for (const url of msg.media_urls) {
        // Extract path from full URL
        // URL format: https://xxx.supabase.co/storage/v1/object/public/messages/chat_id/filename
        // or just the path: chat_id/filename
        let path = url;
        if (url.includes("/storage/v1/object/")) {
          const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/messages\/(.+)/);
          if (match && match[1]) {
            path = match[1];
          }
        }
        allPaths.push({ path, messageId: msg.id, message: msg });
      }
    }
  }

  if (allPaths.length === 0) {
    return { items: [], hasMore };
  }

  // Create signed URLs for all paths
  const { data: signedUrls, error: signError } = await supabase.storage
    .from("messages")
    .createSignedUrls(
      allPaths.map((p) => p.path),
      3600 // 1 hour expiry
    );

  if (signError) {
    console.error("Error creating signed URLs:", signError);
    throw new Error("Không thể tạo liên kết truy cập media");
  }

  // Build result items
  const items: ConversationMediaItem[] = [];

  for (let i = 0; i < allPaths.length; i++) {
    const pathItem = allPaths[i];
    const signedData = signedUrls?.[i];

    if (!pathItem || !signedData?.signedUrl) continue;

    const { path, messageId, message } = pathItem;
    const fileName = path.split("/").pop() || "file";
    const ext = fileName.split(".").pop()?.toLowerCase() || "";

    // Determine file type
    let fileType: "image" | "video" | "file" = "file";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
      fileType = "image";
    } else if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) {
      fileType = "video";
    }

    const sender = message.sender as { display_name: string | null; username: string | null; avatar_url: string | null } | null;

    items.push({
      id: `${messageId}-${i}`,
      messageId,
      url: path,
      signedUrl: signedData.signedUrl,
      fileName,
      fileType,
      senderId: message.sender_id,
      senderName: sender?.display_name || sender?.username || null,
      senderAvatar: sender?.avatar_url || null,
      createdAt: message.created_at,
    });
  }

  return { items, hasMore };
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
  replyToId?: string, // For reply feature
  mediaUrls?: string[] // For file attachments
): Promise<Message> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  // Allow empty content if there are media attachments
  if (!content.trim() && (!mediaUrls || mediaUrls.length === 0)) {
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

  // Determine message type based on content
  let finalMessageType: MessageType = messageType;
  if (mediaUrls && mediaUrls.length > 0) {
    // Check if all files are images
    const allImages = mediaUrls.every((url) => {
      const ext = url.split(".").pop()?.toLowerCase();
      return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
    });
    finalMessageType = allImages ? "image" : "file";
  }

  // Insert message
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content.trim() || (mediaUrls?.length ? "Đã gửi file" : ""),
      message_type: finalMessageType,
      reply_to_id: replyToId || null,
      media_urls: mediaUrls || null,
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

  const { error } = await supabase.rpc("mark_conversation_as_read", {
    conversation_id: conversationId,
  });

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
