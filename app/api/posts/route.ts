import { createClient } from "@/lib/supabase/server";
import { queuePostCreation } from "@/services/postQueueService";
import { fetchPosts } from "@/services/postService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  params: Promise<{ page?: string; itemsPerPage: number }>
) {
  try {
    const { page: pageParam, itemsPerPage } = await params;
    const page = parseInt(pageParam || "1", 10);
    const posts = await fetchPosts(page, itemsPerPage || 10);

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal server error",
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let formData;
    try {
      // Parse FormData for file uploads
      formData = await request.formData();
    } catch (formError) {
      console.error("FormData parse error:", formError);
      return NextResponse.json(
        {
          error:
            "Failed to parse form data. The files may be too large. Maximum recommended size: 100MB total",
          details:
            formError instanceof Error ? formError.message : "Unknown error",
        },
        { status: 413 } // Payload Too Large
      );
    }

    const content = formData.get("content") as string;
    const privacy_level = (formData.get("privacy_level") as string) || "public";
    const mediaFiles: File[] = [];

    // Extract all file uploads (sent as "files" from FormData)
    const filesFromFormData = formData.getAll("files");
    console.log(`📥 Received ${filesFromFormData.length} files`);

    for (const file of filesFromFormData) {
      if (file instanceof File) {
        console.log(
          `  - ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`
        );
        mediaFiles.push(file);
      }
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Queue the post creation with files
    // Worker will handle file uploads + post creation
    await queuePostCreation(
      user.id,
      content,
      privacy_level as "public" | "friends" | "private",
      mediaFiles
    );

    // Return immediately to client with 202 Accepted status
    return NextResponse.json(
      {
        message: "Post creation queued successfully",
        filesQueued: mediaFiles.length,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
