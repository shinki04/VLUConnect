import { getFeedCacheService } from "@repo/redis/feedCacheService";
import { getRedisClient } from "@repo/redis/redis";
import { FeedFilter } from "@repo/shared/types/post";
import { NextRequest, NextResponse } from "next/server";

import { fetchPosts } from "@/app/actions/post";

export async function GET(request: NextRequest) {
  try {
    const redis = getRedisClient();
    const feedCache = getFeedCacheService();
    await redis.connect();

    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const itemsPerPage = parseInt(
      request.nextUrl.searchParams.get("itemsPerPage") || "10",
      10
    );
    const userId = request.nextUrl.searchParams.get("userId");
    const noCache = request.nextUrl.searchParams.get("noCache") === "true";
    const filter = (request.nextUrl.searchParams.get("filter") as unknown as FeedFilter) || "all";

    // Check if cache bypass is requested
    let cacheStatus = "MISS";

    if (!noCache) {
      // Try to get from cache first
      const cachedFeed = await feedCache.getCachedFeedPage(
        userId!,
        page,
        itemsPerPage,
        filter
      );
      if (cachedFeed) {
        cacheStatus = "HIT";
        return NextResponse.json(
          {
            posts: cachedFeed.posts,
            hasMore: cachedFeed.hasMore,
            total: cachedFeed.total,
            currentPage: cachedFeed.page,
          },
          {
            headers: {
              "X-Cache-Status": cacheStatus,
              "X-Cache-Key": `feed:${userId}:${filter}:${page}:${itemsPerPage}`,
            },
          }
        );
      }
    }

    // Fetch from database
    const response = await fetchPosts(page, itemsPerPage, filter);

    return NextResponse.json(response, {
      headers: {
        "X-Cache-Status": noCache ? "BYPASS" : cacheStatus,
        "X-Cache-Key": `feed:${userId}:${filter}:${page}:${itemsPerPage}`,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal server error",
      status: 500,
    });
  }
}
// export async function GET(request: NextRequest) {
//   const userId = request.nextUrl.searchParams.get("userId") || "guest";
//   const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
//   const itemsPerPage = parseInt(
//     request.nextUrl.searchParams.get("itemsPerPage") || "10",
//     10
//   );

//   try {
//     const redis = getRedisClient();
//     await redis.connect();

//     const feedIds = await getPostIdsWithCache(userId);
//     const start = (page - 1) * itemsPerPage;
//     const end = start + itemsPerPage;

//     const posts = [];
//     for (const id of feedIds.slice(start, end)) {
//       const post = await getPostCached(id);
//       posts.push(post);
//     }

//     return NextResponse.json({
//       posts,
//       currentPage: page,
//       hasMore: end < feedIds.length,
//     });
//   } catch (error) {
//     return NextResponse.json({
//       error: error instanceof Error ? error.message : "Internal server error",
//       status: 500,
//     });
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const supabase = await createClient();
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     let formData;
//     try {
//       // Parse FormData for file uploads
//       formData = await request.formData();
//     } catch (formError) {
//       console.error("FormData parse error:", formError);
//       return NextResponse.json(
//         {
//           error:
//             "Failed to parse form data. The files may be too large. Maximum recommended size: 100MB total",
//           details:
//             formError instanceof Error ? formError.message : "Unknown error",
//         },
//         { status: 413 } // Payload Too Large
//       );
//     }

//     const content = formData.get("content") as string;
//     const privacy_level = (formData.get("privacy_level") as string) || "public";
//     const queueId = formData.get("queueId") as string | null;
//     const mediaFiles: File[] = [];

//     // Extract all file uploads (sent as "files" from FormData)
//     const filesFromFormData = formData.getAll("files");
//     console.log(`Received ${filesFromFormData.length} files`);

//     for (const file of filesFromFormData) {
//       if (file instanceof File) {
//         console.log(
//           `  - ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`
//         );
//         mediaFiles.push(file);
//       }
//     }

//     if (!content?.trim()) {
//       return NextResponse.json(
//         { error: "Content is required" },
//         { status: 400 }
//       );
//     }

//     // Queue the post creation with files
//     // Worker will handle file uploads + post creation
//     await queuePostCreation(
//       user.id,
//       content,
//       privacy_level as "public" | "friends" | "private",
//       mediaFiles,
//       queueId || undefined
//     );

//     // Return immediately to client with 202 Accepted status
//     return NextResponse.json(
//       {
//         message: "Post creation queued successfully",
//         filesQueued: mediaFiles.length,
//       },
//       { status: 202 }
//     );
//   } catch (error) {
//     console.error("API error:", error);
//     return NextResponse.json(
//       {
//         error: error instanceof Error ? error.message : "Internal server error",
//       },
//       { status: 500 }
//     );
//   }
// }
