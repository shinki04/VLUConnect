"use server";

import { Tables } from "@repo/shared/types/database.types";
import { ReportType } from "@repo/shared/types/report";
import { createClient } from "@repo/supabase/server";

export type ModerationAction = Tables<"moderation_actions">;

/**
 * Get moderation action for a specific target
 * Used to display why content was removed
 */
export async function getModerationAction(
    targetType: ReportType,
    targetId: string
): Promise<ModerationAction | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("moderation_actions")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error fetching moderation action:", error);
        return null;
    }

    return data;
}
