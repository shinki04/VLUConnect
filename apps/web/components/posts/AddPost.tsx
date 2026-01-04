"use client";

import "@uppy/react/css/style.css";

import { privacyPost } from "@repo/shared/types/post";
import type { User } from "@repo/shared/types/user";
import { createClient } from "@repo/supabase/client";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { Dropzone, FilesGrid, UppyContextProvider } from "@uppy/react";
import { EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { createQueueStatus } from "@/app/actions/post-queue";
import { useCreatePostMutation } from "@/hooks/usePost";
import { useUppyWithSupabase } from "@/hooks/useUppy"; // hook đã sửa ở trên
import {
  createPostSchema,
  validateContent,
} from "@/lib/validations/addPost-schema";

interface AddPostProps {
  currentUser: User;
  groupId?: string;
  allowAnonymousPosts?: boolean;
}

function AddPost({ currentUser, groupId, allowAnonymousPosts = false }: AddPostProps) {
  const router = useRouter();
  const supabase = createClient();
  const uppy = useUppyWithSupabase("posts", "add-post");
  const [isAnonymous, setIsAnonymous] = useState(false);

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
        queueOperations: "CREATE",
        groupId,
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
            toast.error("Một số file upload thất bại", { id: "upload" });
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
        console.log("📝 [add.tsx] Calling createPostMutation with:", {
          queueId: res?.id,
          userId: currentUser.id,
          groupId: groupId || null,
          mediaUrlsCount: mediaUrls.length,
        });
        
        await createPostMutation.mutateAsync({
          queueId: res?.id,
          userId: currentUser.id,
          queueStatus: "processing",
          content: res?.content,
          privacyLevel: value.privacy_level,
          media_urls: mediaUrls,
          groupId: groupId || null,
          isAnonymous: groupId && allowAnonymousPosts ? isAnonymous : false,
        });

        toast.success("Bài đăng đã vào danh sách chờ");
        form.reset();
        uppy.cancelAll();
        
        // Refresh page để load lại posts (đặc biệt cho group posts)
        if (groupId) {
          router.refresh();
        }
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
  // useEffect(() => {
  //   return () => {
  //     uppy;
  //   };
  // }, [uppy]);
  useEffect(() => {
    return () => {
      uppy.cancelAll();
    };
  }, [uppy]);

  return (
    <Card className="rounded-lg shadow p-6 my-6">
      <UppyContextProvider uppy={uppy}>
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
            <article
            // id="uppy-dashboard-container"
            //   className="border-2 border-dashed rounded-lg h-4"
            />
            <Dropzone />
            <FilesGrid imageThumbnail={true} columns={2} />
          </div>

          {/* Quyền riêng tư - ẩn khi đăng trong group (theo quyền riêng tư của group) */}
          {!groupId && (
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
          )}

          {/* Anonymous toggle - only shown when group allows anonymous posts */}
          {groupId && allowAnonymousPosts && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="anonymous-toggle" className="text-sm font-medium cursor-pointer">
                    Đăng ẩn danh
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Tên và ảnh đại diện của bạn sẽ được ẩn
                  </p>
                </div>
              </div>
              <Switch
                id="anonymous-toggle"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>
          )}

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
      </UppyContextProvider>
    </Card>
  );
}

export default AddPost;
