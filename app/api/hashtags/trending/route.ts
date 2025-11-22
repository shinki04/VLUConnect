import { getTrendingHashtags } from "@/services/hashtagService";

/**
 * GET /api/hashtags/trending
 * Get trending hashtags with optional limit
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);

    const hashtags = await getTrendingHashtags(limit);

    return Response.json(
      {
        data: hashtags,
        count: hashtags.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
