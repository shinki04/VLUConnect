"use server";

import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPostLikeStatus(postId: string) {
  const supabase = await createClient();
  const {
      data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { isLiked: false, likeCount: 0 };

  const [postRes, likeRes] = await Promise.all([
      supabase.from("posts").select("like_count").eq("id", postId).single(),
      supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", user.id).single()
  ]);

  return {
      likeCount: postRes.data?.like_count ?? 0,
      isLiked: !!likeRes.data
  };
}

export async function toggleLikePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Check if liked
  const { data: existingLike } = await supabase
    .from("post_likes")
    .select()
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  if (existingLike) {
    await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } else {
    await supabase.from("post_likes").insert({
      post_id: postId,
      user_id: user.id,
    });
  }

  // revalidatePath("/");
  // revalidatePath(`/post/${postId}`);
}

export async function updatePostLikeStatus(postId: string, isLiked: boolean) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) throw new Error("Unauthorized");
  
    if (isLiked) {
        // Want to Like -> Insert if not exists
        // Supabase doesn't have "insert or ignore" easily without constraint violation error handling or extra check.
        // Easiest is check then insert.
        const { data: existingLike } = await supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", postId)
            .eq("user_id", user.id)
            .single();
            
        if (!existingLike) {
             await supabase.from("post_likes").insert({
                post_id: postId,
                user_id: user.id
             });
        }
    } else {
        // Want to Unlike -> Delete
        await supabase
            .from("post_likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id);
    }
    
    revalidatePath("/");
    revalidatePath(`/post/${postId}`);
}

export async function sharePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("post_shares").insert({
    post_id: postId,
    user_id: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
}

export async function addComment(
  postId: string,
  content: string,
  parentId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
      parent_id: parentId || null,
    })
    .select(`
      *,
      author: profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  return data;
}

export async function updateComment(commentId: string, content: string) {
  const supabase = await createClient();
  const {
      data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
      .from("post_comments")
      .update({ content, updated_at: new Date().toISOString(), is_edited: true })
      .eq("id", commentId)
      .eq("user_id", user.id); // Ensure ownership

  if (error) throw new Error(error.message);
  
  revalidatePath("/");
}

export async function deleteComment(commentId: string) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) throw new Error("Unauthorized");
  
    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id); // Ensure ownership
  
    if (error) throw new Error(error.message);
    
    revalidatePath("/");
}

export async function fetchComments(postId: string, page = 1, limit = 10) {
  const supabase = await createClient();
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const { data, error, count } = await supabase
    .from("post_comments")
    .select(
      `
      *,
      author: profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `,
      { count: "exact" }
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false }) // Newest first
    .range(start, end);

  if (error) throw new Error(error.message);

  return { comments: data, total: count || 0 };
}
