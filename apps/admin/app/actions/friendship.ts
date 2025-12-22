"use server";

import { Tables } from "@repo/shared/types/database.types";
import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

// Types
export type Friendship = Tables<"friendships">;
export type FriendshipStatus = Friendship["status"];

export interface FriendshipWithUser extends Friendship {
  requester?: Tables<"profiles">;
  addressee?: Tables<"profiles">;
}

export interface FriendshipResult {
  status: FriendshipStatus | null;
  direction: "sent" | "received" | null;
  friendship: Friendship | null;
}

// ============================================================
// GET Functions
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
 * Get friendship status between current user and target user
 */
export async function getFriendshipStatus(
  targetUserId: string
): Promise<FriendshipResult> {
  const currentUserId = await getCurrentUserId();

  if (currentUserId === targetUserId) {
    return { status: null, direction: null, friendship: null };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
    )
    .maybeSingle();

  if (error) {
    console.error("Error getting friendship status:", error);
    throw new Error("Failed to get friendship status");
  }

  if (!data) {
    return { status: null, direction: null, friendship: null };
  }

  return {
    status: data.status,
    direction: data.requester_id === currentUserId ? "sent" : "received",
    friendship: data,
  };
}

/**
 * Get list of friends for a user
 */
export async function getFriends(userId: string): Promise<Tables<"profiles">[]> {
  const supabase = await createClient();

  // Get all friendships where status is 'friends'
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select(
      `
      requester_id,
      addressee_id,
      requester:profiles!friendships_requester_id_fkey(*),
      addressee:profiles!friendships_addressee_id_fkey(*)
    `
    )
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq("status", "friends");

  if (error) {
    console.error("Error getting friends:", error);
    throw new Error("Failed to get friends");
  }

  if (!friendships) return [];

  // Extract friend profiles
  return friendships.map((f) => {
    if (f.requester_id === userId) {
      return f.addressee as Tables<"profiles">;
    }
    return f.requester as Tables<"profiles">;
  });
}

/**
 * Get pending friend requests for current user
 */
export async function getPendingRequests(): Promise<FriendshipWithUser[]> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
      *,
      requester:profiles!friendships_requester_id_fkey(*)
    `
    )
    .eq("addressee_id", currentUserId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error getting pending requests:", error);
    throw new Error("Failed to get pending requests");
  }

  return (data as FriendshipWithUser[]) || [];
}

/**
 * Get sent friend requests for current user
 */
export async function getSentRequests(): Promise<FriendshipWithUser[]> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
      *,
      addressee:profiles!friendships_addressee_id_fkey(*)
    `
    )
    .eq("requester_id", currentUserId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error getting sent requests:", error);
    throw new Error("Failed to get sent requests");
  }

  return (data as FriendshipWithUser[]) || [];
}

// ============================================================
// ACTION Functions
// ============================================================

/**
 * Send a friend request to target user
 */
export async function sendFriendRequest(
  targetUserId: string
): Promise<Friendship> {
  const currentUserId = await getCurrentUserId();

  if (currentUserId === targetUserId) {
    throw new Error("Cannot send friend request to yourself");
  }

  const supabase = await createClient();

  // Check if friendship already exists
  const existing = await getFriendshipStatus(targetUserId);
  if (existing.friendship) {
    if (existing.status === "friends") {
      throw new Error("Already friends");
    }
    if (existing.status === "pending") {
      throw new Error("Friend request already pending");
    }
    if (existing.status === "blocked") {
      throw new Error("Cannot send friend request");
    }
  }

  // Create new friend request
  const { data, error } = await supabase
    .from("friendships")
    .insert({
      requester_id: currentUserId,
      addressee_id: targetUserId,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending friend request:", error);
    throw new Error("Failed to send friend request");
  }

  revalidatePath(`/profile/${targetUserId}`);
  return data;
}

/**
 * Accept or reject a friend request
 */
export async function respondToFriendRequest(
  friendshipId: string,
  accept: boolean
): Promise<Friendship | null> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  // Verify the request is for current user
  const { data: existing } = await supabase
    .from("friendships")
    .select("*")
    .eq("id", friendshipId)
    .eq("addressee_id", currentUserId)
    .eq("status", "pending")
    .single();

  if (!existing) {
    throw new Error("Friend request not found");
  }

  if (accept) {
    // Accept request - update status to 'friends'
    const { data, error } = await supabase
      .from("friendships")
      .update({
        status: "friends",
        updated_at: new Date().toISOString(),
      })
      .eq("id", friendshipId)
      .select()
      .single();

    if (error) {
      console.error("Error accepting friend request:", error);
      throw new Error("Failed to accept friend request");
    }

    revalidatePath(`/profile/${existing.requester_id}`);
    revalidatePath(`/profile/${currentUserId}`);
    return data;
  } else {
    // Reject request - delete the row
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (error) {
      console.error("Error rejecting friend request:", error);
      throw new Error("Failed to reject friend request");
    }

    revalidatePath(`/profile/${existing.requester_id}`);
    return null;
  }
}

/**
 * Cancel a sent friend request
 */
export async function cancelFriendRequest(
  friendshipId: string
): Promise<void> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("friendships")
    .select("*")
    .eq("id", friendshipId)
    .eq("requester_id", currentUserId)
    .eq("status", "pending")
    .single();

  if (!existing) {
    throw new Error("Friend request not found");
  }

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) {
    console.error("Error canceling friend request:", error);
    throw new Error("Failed to cancel friend request");
  }

  revalidatePath(`/profile/${existing.addressee_id}`);
}

/**
 * Unfriend a user
 */
export async function unfriend(targetUserId: string): Promise<void> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("friendships")
    .delete()
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
    )
    .eq("status", "friends");

  if (error) {
    console.error("Error unfriending:", error);
    throw new Error("Failed to unfriend");
  }

  revalidatePath(`/profile/${targetUserId}`);
  revalidatePath(`/profile/${currentUserId}`);
}

/**
 * Block a user
 */
export async function blockUser(targetUserId: string): Promise<Friendship> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  // Check existing relationship
  const existing = await getFriendshipStatus(targetUserId);

  if (existing.friendship) {
    // Update existing to blocked
    const { data, error } = await supabase
      .from("friendships")
      .update({
        status: "blocked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.friendship.id)
      .select()
      .single();

    if (error) {
      console.error("Error blocking user:", error);
      throw new Error("Failed to block user");
    }

    revalidatePath(`/profile/${targetUserId}`);
    return data;
  } else {
    // Create new blocked relationship
    const { data, error } = await supabase
      .from("friendships")
      .insert({
        requester_id: currentUserId,
        addressee_id: targetUserId,
        status: "blocked",
      })
      .select()
      .single();

    if (error) {
      console.error("Error blocking user:", error);
      throw new Error("Failed to block user");
    }

    revalidatePath(`/profile/${targetUserId}`);
    return data;
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(targetUserId: string): Promise<void> {
  const currentUserId = await getCurrentUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("friendships")
    .delete()
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
    )
    .eq("status", "blocked");

  if (error) {
    console.error("Error unblocking user:", error);
    throw new Error("Failed to unblock user");
  }

  revalidatePath(`/profile/${targetUserId}`);
}
