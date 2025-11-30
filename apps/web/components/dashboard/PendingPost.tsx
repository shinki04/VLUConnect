"use client";
import React from "react";

import { usePostQueueStatus } from "@/hooks/usePostQueueStatus";

import PostCard from "./PostCard";

function PendingPost() {
  // Get pending posts from queue
  const { queueItems } = usePostQueueStatus();

  // Convert queue items to optimistic posts
  //TODO Sửa lại kiểu PostResponse
  const optimisticPosts = queueItems.map((item) => ({
    id: item.id,
    post_id: item.post_id,
    author_id: item.user_id,
    content: item.content,
    privacy_level: item.privacy_level,
    media_urls: [], // Will be filled after processing
    like_count: 0,
    comment_count: 0,
    share_count: 0,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
  return (
    <div>
      {/* Pending posts from queue - shown first with optimistic UI */}
      {optimisticPosts.map((post) => (
        <PostCard key={post.id} post={post} isPending={true} />
      ))}
    </div>
  );
}

export default PendingPost;
