"use server";

import { createClient } from "@repo/supabase/server";

export async function getPendingAppeals() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("post_appeals")
        .select(`
      id,
      post_id,
      user_id,
      reason,
      status,
      created_at,
      user:profiles(display_name, avatar_url, username),
      post:posts(content, author_id, media_urls)
    `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error("Failed to load appeals");
    }

    return data || [];
}

export async function updateAppealStatus(appealId: string, postId: string, action: "approve_post" | "reject_appeal") {
    const supabase = await createClient();

    // Update the appeal status
    await supabase
        .from("post_appeals")
        .update({ status: "resolved" })
        .eq("id", appealId);

    // If approved, restore the post
    if (action === "approve_post") {
        await supabase
            .from("posts")
            .update({ moderation_status: "approved" })
            .eq("id", postId);
    }
}
