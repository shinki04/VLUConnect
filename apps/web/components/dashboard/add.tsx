"use client";

import { privacyPost } from "@repo/shared/types/post";
import { useForm } from "@tanstack/react-form";
import React, { useEffect, useRef } from "react";
import { toast } from "sonner";

import "@uppy/react/css/style.css";

import { Dropzone, FilesList, UppyContextProvider } from "@uppy/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePostMutation } from "@/hooks/usePost";
import { createClient } from "@/lib/supabase/client";
import {
  createPostSchema,
  validateContent,
} from "@/lib/validations/addPost-schema";
import type { User } from "@repo/shared/types/user";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useUppyWithSupabase } from "@/hooks/useUppy"; // hook đã sửa ở trên
import { createQueueStatus } from "@/app/actions/post-queue";

interface AddPostProps {
  currentUser: User;
}

function AddPost({ currentUser }: AddPostProps) {
  const supabase = createClient();
  const uppy = useUppyWithSupabase("posts");
  const dashboardMounted = useRef(false);

  const createPostMutation = useCreatePostMutation();

  const form = useForm({
    defaultValues: {
      content: "",
      media: [] as File[],
      privacy_level: "public" as privacyPost,
    },
    onSubmit: async ({ value }) => {
      if (!currentUser) {
        toast.error("Vui lòng đăng nhập để đăng bài");
        return;
      }
      const validatedData = createPostSchema.safeParse(value);

      if (!validatedData.success) {
        const errors = validatedData.error.issues
          .map((err) => err.message)
          .join(", ");
        toast.error(`Dữ liệu không hợp lệ: ${errors}`);
        return;
      }

      const files = uppy.getFiles();
      const res = await createQueueStatus({
        userId: currentUser.id,
        content: value.content,
        privacyLevel: value.privacy_level,
        mediaCount: files.length,
      });

      if (!res) {
        toast.error("Có lỗi xảy ra");
        return;
      }

      let mediaUrls: string[] = [];

      try {
        // Nếu có file → upload trước
        if (files.length > 0) {
          toast.loading("Đang upload media...", { id: "upload" });

          const result = await uppy.upload();

          toast.dismiss("upload");

          if (!result || result === undefined) return null;

          if (result.failed!.length > 0) {
            toast.error("Một số file upload thất bại");
            return;
          }

          // Lấy public URL của các file thành công
          mediaUrls = result.successful!.map((file) => {
            const path = file.meta.objectName as string;
            const { data } = supabase.storage.from("posts").getPublicUrl(path);
            return data.publicUrl;
          });
        }

        // Tạo post với danh sách URL
        await createPostMutation.mutateAsync({
          queueId: res?.id,
          userId: currentUser.id,
          queueStatus: "processing",
          content: res?.content,
          privacyLevel: value.privacy_level,
          media_urls: mediaUrls,
        });

        toast.success("Bài đăng đã vào danh sách chờ");
        form.reset();
        uppy.cancelAll();
      } catch (error: unknown) {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : "Có lỗi xảy ra khi đăng bài"
        );
      }
    },
  });

  // Mount Dashboard chỉ 1 lần
  //   useEffect(() => {
  //     if (dashboardMounted.current) return;
  //     dashboardMounted.current = true;

  //     uppy.use(Dashboard, {
  //       inline: true,
  //       target: "#uppy-dashboard-container",
  //       proudlyDisplayPoweredByUppy: false,
  //       hideProgressDetails: false,
  //       height: 380,
  //       note: "Tối đa 10 file, mỗi file ≤ 10MB (ảnh, video, PDF, Word, Excel...)",
  //     });
  //   }, [uppy]);

  // Cleanup khi rời component
  useEffect(() => {
    return () => {
      uppy;
    };
  }, [uppy]);

  return (
    <UppyContextProvider uppy={uppy}>
      <Card className="rounded-lg shadow p-6 my-6">
        <h2 className="text-xl font-semibold mb-4">Tạo bài viết mới</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Nội dung */}
          <form.Field
            name="content"
            validators={{
              onChange: ({ value }) => validateContent(value),
            }}
          >
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung
                </label>
                <Textarea
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 resize-none"
                  placeholder="Bạn đang nghĩ gì?..."
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <div className="text-red-500">
                    {field.state.meta.errors?.join(", ")}
                  </div>
                  <div>{field.state.value.length}/5000</div>
                </div>
              </div>
            )}
          </form.Field>

          {/* Uppy Dashboard */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thêm media (tối đa 10 file)
            </label>
            <div
            // id="uppy-dashboard-container"
            //   className="border-2 border-dashed rounded-lg h-4"
            />
            <Dropzone />
            <FilesList />
          </div>

          {/* Quyền riêng tư */}
          <form.Field name="privacy_level">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quyền riêng tư
                </label>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as privacyPost)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn quyền riêng tư" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Công khai</SelectItem>
                    <SelectItem value="friends">Bạn bè</SelectItem>
                    <SelectItem value="private">Chỉ mình tôi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          {/* Nút */}
          <div className="flex justify-end gap-3">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      uppy.cancelAll();
                    }}
                    disabled={!canSubmit || isSubmitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !canSubmit || isSubmitting || createPostMutation.isPending
                    }
                  >
                    {isSubmitting || createPostMutation.isPending
                      ? "Đang đăng..."
                      : "Đăng bài"}
                  </Button>
                </>
              )}
            </form.Subscribe>
          </div>
        </form>
      </Card>
    </UppyContextProvider>
  );
}

export default AddPost;
