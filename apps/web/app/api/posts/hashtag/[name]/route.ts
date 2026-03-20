import { PostResponse } from "@repo/shared/types/post";
import { createClient } from "@repo/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/posts/hashtag/{name}?page=1&itemsPerPage=10
 * Get posts for a specific hashtag with pagination (lookup by name)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name: hashtagName } = await params;
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const itemsPerPage = parseInt(
      request.nextUrl.searchParams.get("itemsPerPage") || "10",
      10
    );

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedName = decodeURIComponent(hashtagName);

    // Get the hashtag by name
    const { data: hashtag, error: hashtagError } = await supabase
      .from("hashtags")
      .select("id, name, post_count")
      .eq("name", decodedName)
      .single();

    if (hashtagError || !hashtag) {
      return NextResponse.json({
        posts: [],
        hasMore: false,
        total: 0,
        currentPage: page,
        hashtag: { name: decodedName, post_count: 0 },
      });
    }

    const offset = (page - 1) * itemsPerPage;

    // Get total count of posts for this hashtag
    const { count, error: countError } = await supabase
      .from("post_hashtags")
      .select("*, posts!inner(is_deleted)", { count: "exact", head: true })
      .eq("hashtag_id", hashtag.id)
      .eq("posts.is_deleted", false);

    if (countError) {
      throw new Error(`Failed to count posts: ${countError.message}`);
    }

    const total = count ?? 0;

    // Get posts with author info via post_hashtags join
    const { data: postHashtags, error: postsError } = await supabase
      .from("post_hashtags")
      .select(
        `
        post_id,
        posts!inner (
          id,
          created_at,
          author:profiles!posts_author_id_fkey(
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
          group_id,
          is_deleted
        )
      `
      )
      .eq("hashtag_id", hashtag.id)
      .eq("posts.is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + itemsPerPage - 1);

    if (postsError) {
      throw new Error(`Failed to fetch posts: ${postsError.message}`);
    }

    // Extract posts from the join result
    const posts = (postHashtags || [])
      .map((ph) => ph.posts)
      .filter(Boolean) as PostResponse[];

    // Check like status for current user
    let postsWithLikeStatus = posts;
    if (posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      const likedPostIds = new Set(likes?.map((l) => l.post_id) || []);
      postsWithLikeStatus = posts.map((post) => ({
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
      hashtag: {
        name: hashtag.name,
        post_count: hashtag.post_count ?? 0,
      },
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
