"use server";

import { systemAnnouncementCache } from "@repo/redis/systemAnnouncementCacheService";
import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAllAnnouncements(page: number = 1, limit: number = 20) {
  const supabase = await createClient();
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const { data, error, count } = await supabase
    .from("system_announcements")
    .select(
      `
      id,
      title,
      message,
      type,
      start_time,
      end_time,
      is_active,
      created_at,
      created_by,
      creator:profiles!system_announcements_created_by_fkey(
        id,
        display_name,
        avatar_url
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) throw error;

  return {
    announcements: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function createAnnouncement(data: {
  title: string;
  message: string;
  type: string;
  start_time: string;
  end_time?: string | null;
  is_active: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: announcement, error } = await supabase
    .from("system_announcements")
    .insert({
      ...data,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  await systemAnnouncementCache.invalidateActiveAnnouncements();
  revalidatePath("/dashboard/notifications");
  return announcement;
}

export async function updateAnnouncement(
  id: string,
  data: {
    title?: string;
    message?: string;
    type?: string;
    start_time?: string;
    end_time?: string | null;
    is_active?: boolean;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("system_announcements")
    .update(data)
    .eq("id", id);

  if (error) throw error;

  await systemAnnouncementCache.invalidateActiveAnnouncements();
  revalidatePath("/dashboard/notifications");
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("system_announcements")
    .delete()
    .eq("id", id);

  if (error) throw error;

  await systemAnnouncementCache.invalidateActiveAnnouncements();
  revalidatePath("/dashboard/notifications");
  return { success: true };
}
