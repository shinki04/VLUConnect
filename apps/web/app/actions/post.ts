import { createClient } from "@/lib/supabase/server";
import { Post, PostResponse } from "@repo/shared/types/post";

export interface CreatePostInput {
  content: string;
  privacy_level: "public" | "friends" | "private";
  media: File[];
}

export interface CreatePostResponse {
  post: Post;
  mediaUrls: string[];
}

export async function uploadPostImages(
  files: File[],
  userId: string
): Promise<string[]> {
  const supabase = await createClient();

  const uploadedUrls: string[] = [];

  for (const file of files) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("posts")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("posts").getPublicUrl(fileName);

    uploadedUrls.push(publicUrl);
  }

  return uploadedUrls;
}

export async function createPost(
  input: CreatePostInput,
  userId: string
): Promise<CreatePostResponse> {
  const supabase = await createClient();

  // Upload media files first
  const mediaUrls = await uploadPostImages(input.media, userId);

  // Create post in database
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: userId,
      content: input.content,
      privacy_level: input.privacy_level,
      media_urls: mediaUrls,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }

  return {
    post: data,
    mediaUrls,
  };
}
export interface FetchPostsResponse {
  posts: PostResponse[];
  hasMore: boolean;
  total: number;
  currentPage: number;
}

export async function fetchPosts(
  page: number,
  itemsPerPage: number
): Promise<FetchPostsResponse> {
  const supabase = await createClient();

  // Validate page number
  if (page < 1) {
    throw new Error("Page number must be greater than 0");
  }

  const offset = (page - 1) * itemsPerPage;

  // Get total count
  const { count, error: countError } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Failed to count posts: ${countError.message}`);
  }

  const total = count || 0;

  // If offset is beyond total, return empty array
  if (offset >= total && total > 0) {
    return {
      posts: [],
      hasMore: false,
      total,
      currentPage: page,
    };
  }

  // Fetch posts for current page
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      id,
      created_at, 
      author: author_id(
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
      privacy_level
      `
    )
    .range(offset, offset + itemsPerPage - 1)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }

  // Check if there are more posts after current page
  const hasMore = offset + itemsPerPage < total;

  return {
    posts: data || [],
    hasMore,
    total,
    currentPage: page,
  };
}

export async function fetchPostById(postId: string): Promise<Post | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select()
    .eq("id", postId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows found
      return null;
    }
    throw new Error(`Failed to fetch post: ${error.message}`);
  }

  return data;
}

export async function deletePost(postId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }
}

export async function updatePost(
  postId: string,
  content: string,
  privacy_level: "public" | "friends" | "private"
): Promise<Post> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .update({ content, privacy_level })
    .eq("id", postId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`);
  }

  return data;
}
