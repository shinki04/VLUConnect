"use server";

import { ReportStatus, ReportType } from "@repo/shared/types/report";
import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";
export type ReportFilterStatusType = ReportStatus | "all";
export type ReportFilterType = ReportType | "all";

interface ReportsFilter {
  status?: ReportFilterStatusType;
  type?: ReportFilterType;
}

// Get all reports with pagination
export async function getAllReports(
  page: number = 1,
  limit: number = 20,
  filters?: ReportsFilter
) {
  const supabase = await createClient();
  const start = (page - 1) * limit;
  const end = start + limit - 1;

 
  let query = supabase
    .from("reports")
    .select(
      `
    id,
    reported_type,
    reported_id,
    reason,
    description,
    status,
    created_at,
    reporter:profiles!reports_reporter_id_fkey (
      id,
      username,
      display_name,
      avatar_url
    )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(start, end);

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.type && filters.type !== "all") {
    query = query.eq("reported_type", filters.type);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    reports: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// Get pending reports
export async function getPendingReports(page: number = 1, limit: number = 20) {
  return getAllReports(page, limit, { status: "pending" });
}

// Get report by ID
export async function getReportById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

// Update report status
export async function updateReportStatus(
  reportId: string,
  status: Exclude<ReportFilterStatusType, "all">
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("reports")
    .update({
      status,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) throw error;

  revalidatePath("/dashboard/reports");
  return { success: true };
}

// Create a report (for reference - users would call this)
export async function createReport(
  reportedType: string,
  reportedId: string,
  reason: string,
  description?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      reported_type: reportedType,
      reported_id: reportedId,
      reason,
      description,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Get reported message details
export async function getReportedMessage(messageId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles(
        id,
        display_name,
        username,
        avatar_url,
        slug
      )
    `)
    .eq("id", messageId)
    .single();

  if (error) {
    console.error("Failed to fetch reported message:", error);
    return null;
  }

  return data;
}

