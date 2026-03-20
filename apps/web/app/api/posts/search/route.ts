import { PostResponse } from "@repo/shared/types/post";
import { createClient } from "@repo/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/posts/search?q=keyword&page=1&itemsPerPage=10
 * Search posts by content
 */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q") || "";
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const itemsPerPage = parseInt(
      request.nextUrl.searchParams.get("itemsPerPage") || "10",
      10
    );

    if (!query.trim()) {
      return NextResponse.json({
        posts: [],
        hasMore: false,
        total: 0,
        currentPage: page,
      });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const offset = (page - 1) * itemsPerPage;

    // Get total count
    const { count, error: countError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .ilike("content", `%${query}%`)
      .eq("is_deleted", false);

    if (countError) {
      throw new Error(`Failed to count posts: ${countError.message}`);
    }

    const total = count || 0;

    // Fetch posts with author info
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        id,
        created_at,
        author: profiles!posts_author_id_fkey(
          id,
          username,
          display_name,
          avatar_url,
          global_role
        ),
        content,
        media_urls,
        updated_at,
        like_count,
        comment_count,
        share_count,
        privacy_level,
        is_anonymous,
        group_id
      `
      )
      .ilike("content", `%${query}%`)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + itemsPerPage - 1);

    if (error) {
      throw new Error(`Failed to search posts: ${error.message}`);
    }

    const typedData = (data as PostResponse[]) || [];

    // Check like status for current user
    let postsWithLikeStatus = typedData;
    if (typedData.length > 0) {
      const postIds = typedData.map((p) => p.id);
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      const likedPostIds = new Set(likes?.map((l) => l.post_id) || []);
      postsWithLikeStatus = typedData.map((post) => ({
        ...post,
        is_liked_by_viewer: likedPostIds.has(post.id),
      }));
    }

    const hasMore = offset + itemsPerPage < total;

    return NextResponse.json({
      posts: postsWithLikeStatus,
      hasMore,
      total,
      currentPage: page,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
