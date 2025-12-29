"use server";

import { getReportRabbitMQClient } from "@repo/rabbitmq/ReportRabbitMQ";
import { ReportType } from "@repo/shared/types/report";
import { ReportJobPayload } from "@repo/shared/types/reportQueue";
import { createClient } from "@repo/supabase/server";

export interface SubmitReportInput {
  reportedType: ReportType;
  reportedId: string;
  reason: string;
  description?: string;
  content?: string; // Content to analyze (for queue)
  groupId?: string; // For group-scoped keyword checking
}

/**
 * Submit a report - saves to DB and queues for AI analysis (except groups)
 */
export async function submitReport(input: SubmitReportInput) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Bạn cần đăng nhập để báo cáo");
  }

  // 1. Save report to database
  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      reported_type: input.reportedType,
      reported_id: input.reportedId,
      reason: input.reason,
      description: input.description || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create report:", error);
    throw new Error("Không thể tạo báo cáo. Vui lòng thử lại.");
  }

  // 2. Queue for AI analysis (except groups - admin handles manually)
  if (input.reportedType !== "group" && input.content) {
    try {
      const payload: ReportJobPayload = {
        reportId: report.id,
        reportedType: input.reportedType as ReportType,
        reportedId: input.reportedId,
        content: input.content,
        groupId: input.groupId,
      };

      const rabbitMQ = getReportRabbitMQClient();
      if (!rabbitMQ.isReady()) {
        await rabbitMQ.connect();
      }

      await rabbitMQ.publishReportCheck(payload);
      console.log("📤 Report queued for analysis:", report.id);
    } catch (queueError) {
      console.error("Failed to queue report:", queueError);
      // Don't throw - report is saved, just not queued
    }
  }

  return { success: true, reportId: report.id };
}

/**
 * Get content for a reported item (for fetching content to analyze)
 */
export async function getReportedContent(
  reportedType: ReportType,
  reportedId: string
): Promise<{ content: string; groupId?: string } | null> {
  const supabase = await createClient();

  switch (reportedType) {
    case "post": {
      const { data } = await supabase
        .from("posts")
        .select("content, group_id")
        .eq("id", reportedId)
        .single();
      return data ? { content: data.content, groupId: data.group_id || undefined } : null;
    }
    case "comment": {
      const { data } = await supabase
        .from("post_comments")
        .select("content, post_id")
        .eq("id", reportedId)
        .single();
      if (!data) return null;
      // Get group_id from the post
      const { data: post } = await supabase
        .from("posts")
        .select("group_id")
        .eq("id", data.post_id)
        .single();
      return { content: data.content, groupId: post?.group_id || undefined };
    }
    case "message": {
      const { data } = await supabase
        .from("messages")
        .select("content")
        .eq("id", reportedId)
        .single();
      return data ? { content: data.content } : null;
    }
    default:
      return null;
  }
}
