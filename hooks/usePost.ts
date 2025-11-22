"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreatePostInput } from "@/services/postService";
import { useGetCurrentUser } from "./useAuth";

export function useCreatePostMutation() {
  const queryClient = useQueryClient();
  const { data: user } = useGetCurrentUser();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }

      console.log(`📤 Queueing post with ${input.media.length} files...`);

      // Create FormData with files
      const formData = new FormData();
      formData.append("content", input.content);
      formData.append("privacy_level", input.privacy_level);

      // Append each file
      input.media.forEach((file) => {
        formData.append("files", file);
      });

      // Send to API route which will queue the job
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to queue post");
      }

      const result = await response.json();

      // Return immediately (202 Accepted pattern)
      // Worker will process in background
      return {
        message: result.message || "Post creation queued successfully",
        status: "queued",
        filesQueued: result.filesQueued,
      };
    },
    onSuccess: () => {
      // Invalidate posts query to refetch
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: Error) => {
      console.error("Error queueing post:", error);
      throw error;
    },
  });
}
