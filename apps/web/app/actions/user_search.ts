"use server";

import { SearchedUser } from "@repo/shared/types/user";
import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

export async function searchUsersWithFriendship(
    searchQuery: string = "",
    roleFilter: string = "all",
    friendStatusFilter: string = "all",
    limit: number = 20,
    offset: number = 0
): Promise<SearchedUser[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("search_users_with_friendship", {
        search_query: searchQuery,
        role_filter: roleFilter,
        friend_status_filter: friendStatusFilter,
        limit_val: limit,
        offset_val: offset,
    });

    if (error) {
        console.error("Error searching users with friendship:", error);
        throw new Error("Failed to search users");
    }

    return data as SearchedUser[];
}

export async function acceptRequestFromUser(targetUserId: string) {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error("Unauthorized");

    const currentUserId = authData.user.id;

    const { data: existing } = await supabase
        .from("friendships")
        .select("*")
        .eq("requester_id", targetUserId)
        .eq("addressee_id", currentUserId)
        .eq("status", "pending")
        .single();

    if (!existing) {
        throw new Error("Friend request not found");
    }

    const { data, error } = await supabase
        .from("friendships")
        .update({
            status: "friends",
            updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

    if (error) {
        console.error("Error accepting friend request:", error);
        throw new Error("Failed to accept friend request");
    }

    revalidatePath(`/profile/${targetUserId}`);
    revalidatePath(`/profile/${currentUserId}`);
    return data;
}

export async function cancelSentRequestToUser(targetUserId: string) {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error("Unauthorized");

    const currentUserId = authData.user.id;

    const { data: existing } = await supabase
        .from("friendships")
        .select("*")
        .eq("requester_id", currentUserId)
        .eq("addressee_id", targetUserId)
        .eq("status", "pending")
        .single();

    if (!existing) {
        throw new Error("Friend request not found");
    }

    const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", existing.id);

    if (error) {
        console.error("Error canceling friend request:", error);
        throw new Error("Failed to cancel friend request");
    }

    revalidatePath(`/profile/${targetUserId}`);
}
