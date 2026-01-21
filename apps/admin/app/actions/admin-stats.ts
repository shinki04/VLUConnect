"use server";

import { createClient } from "@repo/supabase/server";

// TODO: Regenerate Supabase types to include reports table and new posts columns

// Dashboard overview stats
export async function getDashboardStats() {
  const supabase = await createClient();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Use individual queries with explicit any casts to bypass type issues
  const usersResult = await supabase.from("profiles").select("id", { count: "exact", head: true });
  const usersToday = await supabase.from("profiles").select("id", { count: "exact", head: true }).gte("create_at", todayISO);
  const postsResult = await supabase.from("posts").select("id", { count: "exact", head: true });
  const postsToday = await supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", todayISO);
  const commentsResult = await supabase.from("post_comments").select("id", { count: "exact", head: true });
  
  // These queries use new columns/tables - cast to any
  const flaggedPosts = await supabase.from("posts").select("id", { count: "exact", head: true }).eq("is_flagged", true);
  const rejectedPosts = await supabase.from("posts").select("id", { count: "exact", head: true }).eq("moderation_status", "rejected");
  const pendingReports = await supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending");
  const totalReports = await supabase.from("reports").select("id", { count: "exact", head: true });

  return {
    users: {
      total: usersResult.count ?? 0,
      today: usersToday.count ?? 0,
    },
    posts: {
      total: postsResult.count ?? 0,
      today: postsToday.count ?? 0,
      flagged: flaggedPosts?.count ?? 0,
      rejected: rejectedPosts?.count ?? 0,
    },
    comments: {
      total: commentsResult.count ?? 0,
    },
    reports: {
      pending: pendingReports?.count ?? 0,
      total: totalReports?.count ?? 0,
    },
  };
}

// Get user registration stats by period
export async function getUserStats(period: "daily" | "weekly" | "monthly" | "yearly") {
  const supabase = await createClient();
  
  const now = new Date();
  let startDate: Date;
  let groupFormat: string;
  
  switch (period) {
    case "daily":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      groupFormat = "YYYY-MM-DD";
      break;
    case "weekly":
      startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
      groupFormat = "IYYY-IW";
      break;
    case "monthly":
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1); // Last 12 months
      groupFormat = "YYYY-MM";
      break;
    case "yearly":
      startDate = new Date(now.getFullYear() - 5, 0, 1); // Last 5 years
      groupFormat = "YYYY";
      break;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("create_at")
    .gte("create_at", startDate.toISOString())
    .order("create_at", { ascending: true });

  if (error) throw error;

  // Helper to format week range
  const formatWeekRange = (date: Date): string => {
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

  // Group data by period
  const grouped = (data ?? []).reduce((acc, row) => {
    if (!row.create_at) return acc;
    const date = new Date(row.create_at);
    let key: string;
    
    switch (period) {
      case "daily":
        key = date.toISOString().split("T")[0]!;
        break;
      case "weekly":
        key = formatWeekRange(date);
        break;
      case "monthly":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
      case "yearly":
        key = String(date.getFullYear());
        break;
    }
    
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped)
    .map(([period, count]) => ({
      period,
      count,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

// Get post stats by period
export async function getPostStats(period: "daily" | "weekly" | "monthly" | "yearly") {
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

  const [allPosts, flaggedPosts, rejectedPosts] = await Promise.all([
    supabase
      .from("posts")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true }),
    supabase
      .from("posts")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .eq("is_flagged", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("posts")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .eq("moderation_status", "rejected")
      .order("created_at", { ascending: true }),
  ]);

  // Helper to format week range
  const formatWeekRange = (date: Date): string => {
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

  // Group by period
  const groupByPeriod = (data: { created_at: string | null }[]) => {
    return data.reduce((acc, row) => {
      if (!row.created_at) return acc;
      const date = new Date(row.created_at);
      let key: string;
      
      switch (period) {
        case "daily":
          key = date.toISOString().split("T")[0]!;
          break;
        case "weekly":
          key = formatWeekRange(date);
          break;
        case "monthly":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
        case "yearly":
          key = String(date.getFullYear());
          break;
      }
      
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const allGrouped = groupByPeriod(allPosts.data ?? []);
  const flaggedGrouped = groupByPeriod(flaggedPosts.data ?? []);
  const rejectedGrouped = groupByPeriod(rejectedPosts.data ?? []);

  // Merge into single array
  const periods = [...new Set([
    ...Object.keys(allGrouped), 
    ...Object.keys(flaggedGrouped),
    ...Object.keys(rejectedGrouped),
  ])].sort();
  
  return periods.map((p) => ({
    period: p,
    total: allGrouped[p] ?? 0,
    flagged: flaggedGrouped[p] ?? 0,
    rejected: rejectedGrouped[p] ?? 0,
  }));
}

// Get hashtag stats
export async function getHashtagStats(limit: number = 10) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("hashtags")
    .select("id, name, post_count")
    .order("post_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  
  return data ?? [];
}

// Get report stats
export async function getReportStats() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("reports")
    .select("status, reported_type, created_at");

  if (error) throw error;

  const reports = (data ?? []) as { status: string; reported_type: string; created_at: string }[];

  const byStatus = reports.reduce((acc: Record<string, number>, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byType = reports.reduce((acc: Record<string, number>, row) => {
    acc[row.reported_type] = (acc[row.reported_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    total: data?.length ?? 0,
  };
}

// Get user role stats for distribution chart
export async function getUserRoleStats(): Promise<{ role: string; count: number }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("global_role");

  if (error) throw error;

  const roles = (data ?? []).reduce((acc: Record<string, number>, row) => {
    const role = row.global_role || "user";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(roles).map(([role, count]) => ({ role, count }));
}

// Get group stats by period
export async function getGroupStats(period: "daily" | "weekly" | "monthly" | "yearly") {
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
    .from("groups")
    .select("created_at")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Helper to format week range
  const formatWeekRange = (date: Date): string => {
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

  // Group data by period
  const grouped = (data ?? []).reduce((acc, row) => {
    if (!row.created_at) return acc;
    const date = new Date(row.created_at);
    let key: string;

    switch (period) {
      case "daily":
        key = date.toISOString().split("T")[0]!;
        break;
      case "weekly":
        key = formatWeekRange(date);
        break;
      case "monthly":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
      case "yearly":
        key = String(date.getFullYear());
        break;
    }

    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped)
    .map(([period, count]) => ({
      period,
      count,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

// Get group overview stats for dashboard cards
export async function getGroupOverviewStats() {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [totalResult, todayResult, publicResult, privateResult] = await Promise.all([
    supabase.from("groups").select("id", { count: "exact", head: true }),
    supabase.from("groups").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("groups").select("id", { count: "exact", head: true }).eq("privacy_level", "public"),
    supabase.from("groups").select("id", { count: "exact", head: true }).eq("privacy_level", "private"),
  ]);

  return {
    total: totalResult.count ?? 0,
    today: todayResult.count ?? 0,
    public: publicResult.count ?? 0,
    private: privateResult.count ?? 0,
  };
}
