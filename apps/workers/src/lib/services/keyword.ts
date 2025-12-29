import { createServiceClient } from "@repo/supabase/service";

/**
 * Check content against blocked keywords
 * Returns matched keyword if found, null otherwise
 */
export async function checkBlockedKeywords(
  content: string,
  groupId?: string
): Promise<string | null> {
  const supabase = createServiceClient();

  // Get keywords: global + group-specific (if groupId provided)
  let query = supabase
    .from("blocked_keywords")
    .select("keyword, match_type, scope, group_id");

  // We need to fetch all potentially relevant keywords
  // Using OR logic in Supabase SDK can be tricky with specific group logic
  // The logic in report.ts was: query.or(`scope.eq.global,and(scope.eq.group,group_id.eq.${groupId})`);
  
  if (groupId) {
     query = query.or(`scope.eq.global,and(scope.eq.group,group_id.eq.${groupId})`);
  } else {
    query = query.eq("scope", "global");
  }

  const { data: keywords, error } = await query;

  if (error || !keywords) {
    console.error("Failed to fetch blocked keywords:", error);
    return null;
  }

  const lowerContent = content.toLowerCase();

  for (const kw of keywords) {
    const lowerKeyword = kw.keyword.toLowerCase();

    if (kw.match_type === "exact") {
      // Exact word match using word boundaries
      const regex = new RegExp(`\\b${lowerKeyword}\\b`, "i");
      if (regex.test(lowerContent)) {
        return kw.keyword;
      }
    } else {
      // Partial match (contains)
      if (lowerContent.includes(lowerKeyword)) {
        return kw.keyword;
      }
    }
  }

  return null;
}
