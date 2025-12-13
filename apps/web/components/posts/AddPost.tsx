"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import { privacyPost } from "@repo/shared/types/post";
import {
  Globe,
  Lock,
  Users,
  CloudUpload,
  Plus,
  X,
  FileText,
  MoreVertical,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { useUppyWithSupabase } from "@/hooks/useUppy";
import type { UppyFile } from "@uppy/core";
import { createClient } from "@/lib/supabase/client";
import { useCreatePostMutation } from "@/hooks/usePost";
import { createQueueStatus } from "@/app/actions/post-queue";
import {
  createPostSchema,
  validateContent,
} from "@/lib/validations/addPost-schema";
import type { User } from "@repo/shared/types/user";

interface AddPostProps {
  currentUser: User;
  onSuccess?: () => void;
}

function AddPost({ currentUser, onSuccess }: AddPostProps) {
  const supabase = createClient();
  const uppy = useUppyWithSupabase("posts", "add-post-uploader");
  const createPostMutation = useCreatePostMutation();

  const [attachedFiles, setAttachedFiles] = useState<UppyFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateFiles = () => setAttachedFiles(uppy.getFiles());
    uppy.on("file-added", updateFiles);
    uppy.on("file-removed", updateFiles);
    uppy.on("complete", updateFiles);
    return () => {
      uppy.off("file-added", updateFiles);
      uppy.off("file-removed", updateFiles);
      uppy.off("complete", updateFiles);
      uppy.cancelAll();
    };
  }, [uppy]);

  const handleAddFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        try {
          uppy.addFile({
            source: "user",
            name: file.name,
            type: file.type,
            data: file,
          });
        } catch (err: any) {
          if (err.isRestriction) toast.error(err.message);
        }
      });
    },
    [uppy]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleAddFiles(e.dataTransfer.files);
  };

  const form = useForm({
    defaultValues: {
      content: "",
      media: [] as File[],
      privacy_level: "public" as privacyPost,
    },
    onSubmit: async ({ value }) => {
      if (!currentUser) {
        toast.error("Vui lòng đăng nhập");
        return;
      }

      const validated = createPostSchema.safeParse(value);
      if (!validated.success) {
        toast.error("Nội dung không hợp lệ");
        return;
      }

      const files = uppy.getFiles();
      const res = await createQueueStatus({
        userId: currentUser.id,
        content: value.content,
        privacyLevel: value.privacy_level,
        mediaCount: files.length,
        queueOperations: "CREATE",
      });

      if (!res) {
        toast.error("Lỗi khởi tạo bài viết");
        return;
      }

      let mediaUrls: string[] = [];

      try {
        if (files.length > 0) {
          toast.loading("Đang tải lên...", { id: "upload" });
          const result = await uppy.upload();
          toast.dismiss("upload");

          if (!result || result.failed.length > 0) {
            toast.error("Lỗi upload file");
            return;
          }

          mediaUrls = result.successful.map((f) => {
            const { data } = supabase.storage
              .from("posts")
              .getPublicUrl(f.meta.objectName as string);
            return data.publicUrl;
          });
        }

        await createPostMutation.mutateAsync({
          queueId: res.id,
          userId: currentUser.id,
          queueStatus: "processing",
          content: res.content,
          privacyLevel: value.privacy_level as
            | "public"
            | "friends"
            | "private",
          media_urls: mediaUrls,
        });

        toast.success("Đăng bài thành công!");
        form.reset();
        uppy.cancelAll();
        if (onSuccess) onSuccess();
      } catch (e: any) {
        toast.error(e.message || "Có lỗi xảy ra");
      }
    },
  });

  const handleCancel = () => {
    form.reset();
    uppy.cancelAll();
    if (onSuccess) onSuccess();
  };

  const shortName = currentUser?.display_name?.split(" ").pop() || "bạn";

  return (
    <div className="flex flex-col h-full bg-white sm:rounded-[24px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col h-full"
      >
        {/* HEADER */}
        <div className="px-6 pt-6 pb-2 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border border-gray-100 shadow-sm">
              <AvatarImage src={currentUser?.avatar_url || ""} />
              <AvatarFallback>
                {currentUser?.display_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold text-[#37426F] text-[16px]">
                {currentUser?.display_name || "User"}
              </span>
              <span className="text-[13px] text-gray-400 font-medium">
                Sinh viên
              </span>
            </div>
          </div>

          {/* PRIVACY SELECTOR – đảm bảo dễ click, không bị che */}
          <div className="flex items-center gap-2 mt-1 relative z-[10001]">
            <span className="text-[13px] text-gray-500 font-medium">
              Tuỳ chỉnh:
            </span>
            <form.Field name="privacy_level">
              {(field) => (
                <Select
                  value={field.state.value}
                  onValueChange={(v) =>
                    field.handleChange(v as privacyPost)
                  }
                >
                  <SelectTrigger className="min-w-[160px] h-9 px-3 border border-gray-300 rounded-md bg-white text-[13px] text-[#37426F]">
                    <SelectValue placeholder="Chọn quyền riêng tư" />
                  </SelectTrigger>

                  <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl min-w-[180px] z-[10002]">
                    <SelectItem value="public">
                      <div className="flex items-center gap-2 text-[#37426F] text-[14px]">
                        <Globe className="w-4 h-4" />
                        <span>Công khai</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="friends">
                      <div className="flex items-center gap-2 text-[#37426F] text-[14px]">
                        <Users className="w-4 h-4" />
                        <span>Bạn bè</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2 text-[#37426F] text-[14px]">
                        <Lock className="w-4 h-4" />
                        <span>Riêng tư</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </form.Field>

            <MoreVertical className="w-5 h-5 text-[#37426F] cursor-pointer" />
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar">
          <form.Field
            name="content"
            validators={{ onChange: ({ value }) => validateContent(value) }}
          >
            {(field) => (
              <div className="relative mb-6">
                <Textarea
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={`Hi ${shortName}, bạn đang nghĩ gì?`}
                  className="w-full min-h-[140px] text-[16px] border-none shadow-none resize-none px-5 py-4 focus-visible:ring-0 placeholder:text-gray-400 bg-[#EEF2FF] rounded-[20px] text-[#37426F]"
                />
                <div className="flex justify-between text-[11px] mt-1 px-1">
                  <div className="text-red-500">
                    {field.state.meta.errors?.join(", ")}
                  </div>
                  <div className="text-gray-400">
                    {field.state.value.length}/5000
                  </div>
                </div>
              </div>
            )}
          </form.Field>

          {/* UPLOAD BOX */}
          <div
            className={`relative border-[1.5px] border-dashed rounded-[20px] transition-colors min-h-[180px] flex flex-col items-center justify-center text-center p-6 group cursor-pointer
            ${isDragging
                ? "border-[#37426F] bg-blue-50"
                : "border-[#93C5FD] bg-[#F8FAFC] hover:bg-[#F1F5F9]"
              }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) handleAddFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="pointer-events-none flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                <CloudUpload
                  className="w-7 h-7 text-[#37426F]"
                  strokeWidth={1.5}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[15px] font-bold text-[#37426F]">
                  Chọn hoặc thả file{" "}
                  <span className="underline decoration-[#37426F]">
                    tại đây
                  </span>
                </p>
                <p className="text-[12px] text-gray-400 max-w-[220px] mx-auto">
                  Tối đa 10 file (ảnh, video, PDF, Word...)
                </p>
              </div>
            </div>
          </div>

          {/* FILES LIST */}
          {attachedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold text-[#37426F] uppercase">
                Đã chọn ({attachedFiles.length})
              </p>
              <div className="grid gap-2">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center bg-[#EEF2FF] rounded-lg text-[#37426F]">
                        {file.type?.startsWith("image/") ? (
                          "IMG"
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-[#37426F] truncate max-w-[200px]">
                        {file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        uppy.removeFile(file.id);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 px-6 flex justify-end gap-3 bg-white border-t border-gray-50 pt-4">
          <Button
            type="button"
            onClick={handleCancel}
            className="bg-gray-100 hover:bg-gray-200 text-[#37426F] rounded-[14px] px-6 font-bold h-11 transition-colors"
          >
            Hủy
          </Button>

          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={
                  !canSubmit ||
                  isSubmitting ||
                  createPostMutation.isPending
                }
                className="bg-[#37426F] hover:bg-[#2a3255] text-white rounded-[14px] px-8 font-bold h-11 shadow-lg shadow-[#37426F]/20 flex items-center gap-2"
              >
                {isSubmitting || createPostMutation.isPending ? (
                  "Đang đăng..."
                ) : (
                  <>
                    Đăng
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}

export default AddPost;
