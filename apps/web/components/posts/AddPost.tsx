"use client";

import "@uppy/react/css/style.css";

import { privacyPost } from "@repo/shared/types/post";
import type { User } from "@repo/shared/types/user";
import { createClient } from "@repo/supabase/client";
import { Button } from "@repo/ui/components/button";
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
import React, { useState } from "react";
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
  onCancel?: () => void;
  onSuccess?: () => void;
}

function AddPost({
  currentUser,
  groupId,
  allowAnonymousPosts = false,
  onCancel,
  onSuccess,
}: AddPostProps) {
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
        onSuccess?.();

        // Refresh page để load lại posts (đặc biệt cho group posts)
        if (groupId) {
          router.refresh();
        }
      } catch (error: unknown) {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : "Có lỗi xảy ra khi đăng bài",
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

  // NOTE: Removed uppy.cancelAll() on unmount to allow background uploads
  // Uploads will continue even if user navigates away from this page

  return (
    <div className="">
      <UppyContextProvider uppy={uppy}>
        {/* <h2 className="text-xl font-semibold mb-4">Tạo bài viết mới</h2> */}

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
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung
                </label>
                <Textarea
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 resize-none shadow-none min-h-[120px] sm:min-h-[250px]"
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
            <div className="max-h-[300px] overflow-y-auto border rounded-xl border-dashed [&_.uppy-DropZone]:min-h-[80px] [&_.uppy-DropZone-container]:py-4 [&_.uppy-Root]:h-auto! bg-gray-50/50 dark:bg-slate-900/50">
              <Dropzone />
              <FilesGrid imageThumbnail={true} columns={4} />
            </div>
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
                    <SelectTrigger className="w-full shadow-none">
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
                  <Label
                    htmlFor="anonymous-toggle"
                    className="text-sm font-medium cursor-pointer"
                  >
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
                      if (onCancel) {
                        onCancel();
                      } else {
                        form.reset();
                        uppy.cancelAll();
                      }
                    }}
                    disabled={!canSubmit || isSubmitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="bg-mainred hover:bg-mainred-hover text-white"
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
    </div>
  );
}

export default AddPost;
