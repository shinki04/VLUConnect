"use client";
import React from "react";

import { usePostQueueStatus } from "@/hooks/usePostQueueStatus";

import PostCard from "./PostCard";

interface PendingPostProps {
  groupId?: string;
}

function PendingPost({ groupId }: PendingPostProps) {
  // Get pending posts from queue
  const { queueItems } = usePostQueueStatus(groupId);

  // Convert queue items to optimistic posts
  //TODO Sửa lại kiểu PostResponse
  const optimisticPosts = queueItems.map((item) => ({
    id: item.id,
    created_at: item.created_at || new Date().toISOString(),
    author: {
      id: item.user_id,
      username: "loading...",
      display_name: "loading...",
      avatar_url: null,
      global_role: "student" as const,
    },
    content: item.content,
    privacy_level: item.privacy_level,
    media_urls: [] as string[], // Will be filled after processing
    like_count: 0,
    comment_count: 0,
    share_count: 0,
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
