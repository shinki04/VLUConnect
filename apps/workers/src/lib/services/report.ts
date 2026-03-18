import { REPORT_TYPE_TABLE, ReportStatus } from "@repo/shared/types/report";
import { ReportJobPayload } from "@repo/shared/types/reportQueue";
import { createServiceClient } from "@repo/supabase/service";

import { sentimentModel } from "../models/sentimentModel";
import { checkBlockedKeywords } from "./keyword";

/**
 * Process a report check job from queue
 */
export async function processReportCheck(payload: ReportJobPayload) {
  const supabase = createServiceClient();
  console.log(`Processing report check for ${payload.reportedType}:${payload.reportedId}`);

  try {
    // Step 1: Check blocked keywords FIRST
    const matchedKeyword = await checkBlockedKeywords(payload.content, payload.groupId);

    if (matchedKeyword) {
      console.log(`Keyword matched: "${matchedKeyword}"`);

      // Update report status to reviewed (auto-flagged)
      await supabase
        .from("reports")
        .update({
          status: "reviewed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.reportId);

      // Log to moderation_actions
      if (["post", "comment", "message", "group"].includes(payload.reportedType)) {
        await supabase.from("moderation_actions").insert({
          target_type: payload.reportedType as "post" | "comment" | "message" | "group",
          target_id: payload.reportedId,
          action_type: "keyword_blocked",
          reason: `Matched keyword: ${matchedKeyword}`,
          matched_keyword: matchedKeyword,
          created_by: null, // System action
        });
      }

      // Log the keyword match to AI logs as well (for consistency)
      await supabase.from("ai_analysis_logs").insert({
        target_type: payload.reportedType,
        target_id: payload.reportedId,
        model_name: "keyword_filter",
        analysis_type: "keyword_match",
        label: "BLOCKED",
        score: 1.0,
        confidence: 1.0,
        metadata: { matched_keyword: matchedKeyword },
      });

      return { status: "blocked", reason: `Matched keyword: ${matchedKeyword}` };
    }

    // Step 2: Run AI sentiment analysis
    console.log("Running AI sentiment analysis...");
    const sentiment = await sentimentModel(payload.content);

    if (sentiment.length === 0) {
      throw new Error("Failed to get sentiment from AI model");
    }

    // Find NEG sentiment score
    const negSentiment = sentiment.find((s) => s.label === "NEG");
    const negScore = negSentiment?.score ?? 0;

    // Log AI analysis
    await supabase.from("ai_analysis_logs").insert({
      target_type: payload.reportedType,
      target_id: payload.reportedId,
      model_name: "5CD-AI/Vietnamese-Sentiment-visobert",
      analysis_type: "sentiment",
      label: sentiment[0]?.label || "UNKNOWN",
      score: sentiment[0]?.score || 0,
      confidence: negScore,
      metadata: { all_labels: sentiment, report_id: payload.reportId },
    });

    // Determine report status based on sentiment
    let newStatus: ReportStatus = "pending";
    let deleteReportTarget = false;

    if (negScore >= 0.8) {
      newStatus = "reviewed"; // Auto-mark as reviewed if highly negative
      console.log(`High negative sentiment: ${(negScore * 100).toFixed(1)}%`);
      deleteReportTarget = true;
    } else if (negScore > 0.7) {
      // Keep as pending but log warning
      console.log(`Moderate negative sentiment: ${(negScore * 100).toFixed(1)}%`);
    } else {
      console.log(`Low negative sentiment: ${(negScore * 100).toFixed(1)}%`);
    }

    // Update report with analysis results
    await supabase
      .from("reports")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.reportId);

    console.log(`Report ${payload.reportId} processed. Status: ${newStatus}`);

    const table = REPORT_TYPE_TABLE[payload.reportedType];

    // Delete if score too high
    if (deleteReportTarget) {
      // Log generic moderation action
      if (["post", "comment", "message", "group"].includes(payload.reportedType)) {
        await supabase.from("moderation_actions").insert({
          target_type: payload.reportedType as "post" | "comment" | "message" | "group",
          target_id: payload.reportedId,
          action_type: "ai_flagged",
          reason: `AI flagged with high negative confidence: ${(negScore * 100).toFixed(1)}%`,
          ai_score: negScore,
          created_by: null,
        });
      }

      switch (table) {
        case "posts":
          const { data: reportPostTarget, error: reportPostTargetError } = await supabase
            .from(table)
            .update({
              is_deleted: true,
              deleted_by: "AI model",
              deleted_at: new Date().toISOString(),
              moderation_status: "rejected",
              moderation_reason: `AI đã phát hiện nội dung tiêu cực với độ tin cậy ${(negScore * 100).toFixed(1)}%`,
            })
            .eq("id", payload.reportedId);

          if (reportPostTargetError || !reportPostTarget) {
            console.error("Failed to fetch report target:", reportPostTargetError);
            return;
          }

          break;
        case "comments":
          // Soft delete - assumes is_deleted field exists
          const { error: commentError } = await supabase
            .from("post_comments")
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString(),
            })
            .eq("id", payload.reportedId);

          if (commentError) {
            console.error("Failed to delete comment:", commentError);
          } else {
            console.log(`Comment ${payload.reportedId} soft deleted by AI`);
          }
          break;
        case "users":
          // For users, we don't auto-delete, just escalate to admin
          console.log(`User ${payload.reportedId} flagged for admin review`);
          break;
        case "messages":
          const { error: errorMessageTarget } = await supabase
            .from("messages")
            .update({
              is_deleted: true,
            })
            .eq("id", payload.reportedId);

          if (errorMessageTarget) {
            console.error("Failed to delete message:", errorMessageTarget);
          } else {
            console.log(`Message ${payload.reportedId} deleted by AI`);
          }
          break;
        case "groups":
          // For groups, we don't auto-delete, just escalate to admin
          console.log(`Group ${payload.reportedId} flagged for admin review`);
          break;

      }

    }

    return { status: newStatus, negScore };
  } catch (error) {
    console.error("Error processing report:", error);
    throw error;
  }
}
