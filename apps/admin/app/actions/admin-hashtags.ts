"use server";

import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

// Get all hashtags with pagination
export async function getAllHashtags(
  page: number = 1,
  limit: number = 20,
  search?: string
) {
  const supabase = await createClient();
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = supabase
    .from("hashtags")
    .select("*", { count: "exact" })
    .order("post_count", { ascending: false })
    .range(start, end);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    hashtags: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// Get top hashtags
export async function getTopHashtags(limit: number = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hashtags")
    .select("id, name, post_count")
    .order("post_count", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data ?? [];
}

// Delete hashtag
export async function deleteHashtag(hashtagId: string) {
  const supabase = await createClient();

  // First delete from post_hashtags junction table
  await supabase
    .from("post_hashtags")
    .delete()
    .eq("hashtag_id", hashtagId);

  // Then delete the hashtag
  const { error } = await supabase
    .from("hashtags")
    .delete()
    .eq("id", hashtagId);

  if (error) throw error;

  revalidatePath("/dashboard/hashtags");
  return { success: true };
}

// Update hashtag name
export async function updateHashtag(hashtagId: string, name: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("hashtags")
    .update({ name: name.toLowerCase().replace(/^#/, "") })
    .eq("id", hashtagId);

  if (error) throw error;

  revalidatePath("/dashboard/hashtags");
  return { success: true };
}
