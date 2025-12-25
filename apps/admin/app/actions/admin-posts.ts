"use server";

import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

// Moderation status enum
type ModerationStatus = "approved" | "rejected" | "flagged";

interface PostsFilter {
  search?: string;
  authorId?: string;
  isFlagged?: boolean;
  moderationStatus?: ModerationStatus;
}

// Get all posts with pagination
export async function getAllPosts(
  page: number = 1,
  limit: number = 20,
  filters?: PostsFilter
) {
  const supabase = await createClient();
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  // Select posts with author profile info
  let query = supabase
    .from("posts")
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id,
        username,
        display_name,
        avatar_url,
        global_role
      )
    `, { count: "exact" })
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .range(start, end);

  if (filters?.search) {
    query = query.ilike("content", `%${filters.search}%`);
  }

  if (filters?.authorId) {
    query = query.eq("author_id", filters.authorId);
  }

  if (filters?.isFlagged !== undefined) {
    query = query.eq("is_flagged", filters.isFlagged);
  }

  if (filters?.moderationStatus) {
    query = query.eq("moderation_status", filters.moderationStatus);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    posts: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// Get flagged posts only
export async function getFlaggedPosts(page: number = 1, limit: number = 20) {
  return getAllPosts(page, limit, { isFlagged: true });
}

// Get rejected posts only
export async function getRejectedPosts(page: number = 1, limit: number = 20) {
  return getAllPosts(page, limit, { moderationStatus: "rejected" });
}

// Get single post by ID
export async function getPostById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

// Flag a post for review
export async function flagPost(postId: string, reason: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("posts")
    .update({
      is_flagged: true,
      flag_reason: reason,
      moderation_status: "flagged" as ModerationStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw error;

  revalidatePath("/dashboard/posts");
  return { success: true };
}

// Unflag a post (approve)
export async function unflagPost(postId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("posts")
    .update({
      is_flagged: false,
      flag_reason: null,
      moderation_status: "approved" as ModerationStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw error;

  revalidatePath("/dashboard/posts");
  return { success: true };
}

// Soft delete post (admin)
export async function deletePostAdmin(postId: string) {
  const supabase = await createClient();

  // Get current admin user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("posts")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw error;

  revalidatePath("/dashboard/posts");
  return { success: true };
}

// Restore deleted post
export async function restorePost(postId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("posts")
    .update({
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw error;

  revalidatePath("/dashboard/posts");
  return { success: true };
}

// Reject a post (hide from public)
export async function rejectPost(postId: string, reason?: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("posts")
    .update({
      moderation_status: "rejected" as ModerationStatus,
      flag_reason: reason || null,
      is_flagged: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw error;

  revalidatePath("/dashboard/posts");
  return { success: true };
}

// Approve a post (restore to active)
export async function approvePost(postId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("posts")
    .update({
      moderation_status: "approved" as ModerationStatus,
      is_flagged: false,
      flag_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw error;

  revalidatePath("/dashboard/posts");
  return { success: true };
}
