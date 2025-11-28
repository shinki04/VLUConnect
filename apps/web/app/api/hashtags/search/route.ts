import { searchHashtags } from "@/services/hashtagService";

/**
 * GET /api/hashtags/search?q=keyword&limit=20
 * Search hashtags by name
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    if (!query.trim()) {
      return Response.json({ data: [], count: 0 }, { status: 200 });
    }

    const hashtags = await searchHashtags(query, limit);

    return Response.json(
      {
        data: hashtags,
        count: hashtags.length,
        query,
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
