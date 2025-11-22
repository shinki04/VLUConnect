import { getPostsByHashtag } from "@/services/hashtagService";
import { NextRequest } from "next/server";

/**
 * GET /api/hashtags/[name]/posts
 * Get posts for a specific hashtag with pagination
 */
export async function GET(
  request: NextRequest,
  params: Promise<{ name: string }>
) {
  try {
    const { searchParams } = new URL(request.url);
    const { name } = await params;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const hashtagName = decodeURIComponent(name).toLowerCase();
    const { posts, total } = await getPostsByHashtag(
      hashtagName,
      limit,
      offset
    );

    return Response.json(
      {
        data: posts,
        total,
        limit,
        offset,
        hashtag: hashtagName,
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
