"use server";

import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

interface GroupsFilter {
  search?: string;
  privacy?: "public" | "private";
}

// Get all groups with pagination and filtering
export async function getGroups(
  page: number = 1,
  limit: number = 10,
  filters?: GroupsFilter
) {
  const supabase = await createClient();
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = supabase
    .from("groups")
    .select(`
        *,
        members:group_members(count)
    `, { count: "exact" })
    .range(start, end)
    .order("created_at", { ascending: false });

  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  if (filters?.privacy) {
    query = query.eq("privacy_level", filters.privacy);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  // Format data to flatten member count
  const groups = data?.map((group) => ({
      ...group,
      members_count: group.members?.[0]?.count || 0
  })) || [];

  return {
    groups,
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// Get group by ID
export async function getGroupById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .select(`
        *,
        members:group_members(count),
        creator:created_by(*)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

   const group = {
      ...data,
      members_count: data.members?.[0]?.count || 0
  };

  return group;
}

// Create Group (Admin)
// Reusing similar logic to user-side but maybe bypassing some checks or adding specific admin fields if needed
export async function createGroupAdmin(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const privacy_level = formData.get("privacy_level") as "public" | "private";
  const membership_mode = formData.get("membership_mode") as "auto" | "request";

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

    // Check slug uniqueness
  const { data: existingGroup } = await supabase
    .from("groups")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existingGroup) {
    return { error: "Slug already exists" };
  }

  const { data, error } = await supabase
    .from("groups")
    .insert({
      name,
      slug,
      description,
      privacy_level,
      membership_mode,
      created_by: user.id
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Add creator as admin
  await supabase.from("group_members").insert({
    group_id: data.id,
    user_id: user.id,
    role: "admin",
    status: "active"
  });

  revalidatePath("/dashboard/groups");
  return { success: true, data };
}

// Delete Group
export async function deleteGroup(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) return { error: error.message };
    
    revalidatePath("/dashboard/groups");
    return { success: true };
}
