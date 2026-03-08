// "use client";

// import { useMutation } from "@tanstack/react-query";
// import { toast } from "sonner";

// import { useGetCurrentUser } from "./useAuth";
// import { createQueueStatus } from "@/app/actions/post-queue";
// import { CreatePostInput } from "@/lib/validations/addPost-schema";

// export function useCreatePostMutation() {
//   const { data: user } = useGetCurrentUser();

//   return useMutation({
//     mutationFn: async (input: any | CreatePostInput) => {
//       if (!user?.id) {
//         throw new Error("User is not authenticated");
//       }

//       console.log(
//         `📤 Creating queue entry for post with ${input.media.length} files...`
//       );

//       // Create queue status entry

//       const queueStatus = await createQueueStatus(
//         user.id,
//         input.content,
//         input.privacy_level,
//         input.media.length
//       );

//       console.log(`✅ Queue entry created with ID: ${queueStatus.id}`);

//       // Create FormData with files
//       const formData = new FormData();
//       formData.append("content", input.content);
//       formData.append("privacy_level", input.privacy_level);
//       formData.append("queueId", queueStatus.id); // Include queue ID

//       // Append each file
//       input.media.forEach((file) => {
//         formData.append("files", file);
//       });

//       // Send to API route which will queue the job
//       const response = await fetch("/api/posts", {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.message || "Failed to queue post");
//       }

//       const result = await response.json();

//       // Return queue status ID for tracking
//       return {
//         message: result.message || "Post creation queued successfully",
//         status: "queued",
//         filesQueued: result.filesQueued,
//         queueId: queueStatus.id,
//       };
//     },
//     onError: (error: Error) => {
//       console.error("Error queueing post:", error);
//       toast.error(error.message || "Có lỗi xảy ra khi đăng bài");
//     },
//   });
// }

"use client";

import { privacyPost } from "@repo/shared/types/post";
import { PostJobPayload, PostQueueStatus } from "@repo/shared/types/postQueue";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { deletePost } from "@/app/actions/post";
import {
  createQueueStatus,
  queuePostCreation,
  queuePostUpdate,
  updateQueueStatus,
} from "@/app/actions/post-queue";
import { getQueryClient } from "@/lib/react-query";

import { useGetCurrentUser } from "./useAuth";

export function useCreatePostMutation() {
  const { data: user } = useGetCurrentUser();

  return useMutation({
    mutationFn: async (
      input: PostJobPayload & { queueStatus: PostQueueStatus }
    ) => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }

      console.log(input);

      // Create queue status entry

      // const queueStatus = await createQueueStatus(
      //   user.id,
      //   input.content,
      //   input.privacy_level,
      //   input.media.length
      // );

      // console.log(`✅ Queue entry created with ID: ${queueStatus.id}`);

      // // Create FormData with files
      // const formData = new FormData();
      // formData.append("content", input.content);
      // formData.append("privacy_level", input.privacy_level);
      // formData.append("queueId", queueStatus.id); // Include queue ID

      // // Append each file
      // input.media.forEach((file) => {
      //   formData.append("files", file);
      // });

      // // Send to API route which will queue the job
      // const response = await fetch("/api/posts", {
      //   method: "POST",
      //   body: formData,
      // });

      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.message || "Failed to queue post");
      // }

      // const result = await response.json();

      // // Return queue status ID for tracking
      // return {
      //   message: result.message || "Post creation queued successfully",
      //   status: "queued",
      //   filesQueued: result.filesQueued,
      //   queueId: queueStatus.id,
      // };

      // ======================

      const [res, isQueued] = await Promise.all([
        updateQueueStatus(input.queueId, "processing"),
        queuePostCreation(input),
      ]);

      if (isQueued && res) {
        return {
          message: "Post creation queued successfully",
          status: "processing" as PostQueueStatus,
        };
      }
    },
    onError: (error: Error) => {
      console.error("Error queueing post:", error);
      toast.error(error.message || "Có lỗi xảy ra khi đăng bài");
    },
  });
}

export function useDeletePost() {
  const { data: user } = useGetCurrentUser();
  const queryClient = getQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }

      await deletePost(postId, user.id);
    },

    onSettled: () => {
      // Invalidate all post queries across dashboard, groups, authors, and saved feeds
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["groups", "posts"] });
    },
    onError: (error: Error) => {
      console.error("Error queueing post:", error);
      toast.error(error.message || "Có lỗi xảy ra khi đăng bài");
    },
  });
}

export interface UpdatePostInput {
  postId: string;
  content: string;
  privacy_level: "public" | "friends" | "private";
  media_urls: string[];
}

export function useUpdatePost() {
  const { data: user } = useGetCurrentUser();
  const queryClient = getQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePostInput) => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }
      const data = await createQueueStatus({
        userId: user.id,
        content: input.content,
        privacyLevel: input.privacy_level,
        mediaCount: input.media_urls.length,
        queueOperations: "UPDATE",
      });

      const isQueued = await queuePostUpdate({
        userId: user.id,
        postId: input.postId,
        content: input.content,
        privacyLevel: input.privacy_level as privacyPost,
        media_urls: input.media_urls,
        queueOperations: "UPDATE",
        queueStatus: "processing",
        queueId: data.id,
      });

      if (isQueued && data) {
        return {
          message: "Post update queued successfully",
          status: "processing" as PostQueueStatus,
          id: input.postId,
        };
      }

      // return await updatePost(
      //   input.postId,
      //   input.content,
      //   input.privacy_level,
      //   input.media_urls,
      //   user.id
      // );
    },
    onSuccess: () => {
      // Invalidate all posts queries to refetch updated data across all screens
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["groups", "posts"] });

      toast.success("Cập nhật bài viết thành công");
    },
    onError: (error: Error) => {
      console.error("Error updating post:", error);
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật bài viết");
    },
  });
}
