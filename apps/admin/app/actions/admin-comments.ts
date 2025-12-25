"use server";

import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

interface CommentsFilter {
  search?: string;
  postId?: string;
}

// Get all comments with pagination
export async function getAllComments(
  page: number = 1,
  limit: number = 20,
  filters?: CommentsFilter
) {
  const supabase = await createClient();
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = supabase
    .from("post_comments")
    .select(
      `
      *,
      author: profiles (
        id, username, display_name, avatar_url
      ),
      post: posts (
        id, content
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(start, end);

  if (filters?.search) {
    query = query.ilike("content", `%${filters.search}%`);
  }

  if (filters?.postId) {
    query = query.eq("post_id", filters.postId);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    comments: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// Delete comment (admin)
export async function deleteCommentAdmin(commentId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("post_comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;

  revalidatePath("/dashboard/comments");
  return { success: true };
}

// Get comment stats
export async function getCommentStats(period: "daily" | "weekly" | "monthly" | "yearly") {
  const supabase = await createClient();
  
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case "daily":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "weekly":
      startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
      break;
    case "monthly":
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      break;
    case "yearly":
      startDate = new Date(now.getFullYear() - 5, 0, 1);
      break;
  }

  const { data, error } = await supabase
    .from("post_comments")
    .select("created_at")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Helper to get ISO week number
  const getWeekNumber = (date: Date): { year: number; week: number } => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
  };

  // Helper to format week for display
  const formatWeekDisplay = (date: Date): string => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const startMonth = months[weekStart.getMonth()];
    const endMonth = months[weekEnd.getMonth()];
    
    if (startMonth === endMonth) {
      return `${startMonth} ${weekStart.getDate()}-${weekEnd.getDate()}`;
    }
    return `${startMonth} ${weekStart.getDate()}-${endMonth} ${weekEnd.getDate()}`;
  };

  // Helper to get week key for sorting (YYYY-Www format)
  const getWeekKey = (date: Date): string => {
    const { year, week } = getWeekNumber(date);
    return `${year}-W${String(week).padStart(2, "0")}`;
  };

  // Group by period - store both sortable key and display label
  const grouped = (data ?? []).reduce((acc, row) => {
    if (!row.created_at) return acc;
    const date = new Date(row.created_at);
    let sortKey: string;
    let displayLabel: string;
    
    switch (period) {
      case "daily":
        sortKey = date.toISOString().split("T")[0]!;
        displayLabel = sortKey;
        break;
      case "weekly":
        sortKey = getWeekKey(date);
        displayLabel = formatWeekDisplay(date);
        break;
      case "monthly":
        sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        displayLabel = sortKey;
        break;
      case "yearly":
        sortKey = String(date.getFullYear());
        displayLabel = sortKey;
        break;
    }
    
    if (!acc[sortKey]) {
      acc[sortKey] = { count: 0, displayLabel };
    }
    const entry = acc[sortKey]!;
    entry.count += 1;
    return acc;
  }, {} as Record<string, { count: number; displayLabel: string }>);

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { count, displayLabel }]) => ({
      period: displayLabel,
      count,
    }));
}
