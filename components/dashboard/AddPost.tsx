"use client";
import { createPostSchema } from "@/lib/validations/addPost-schema";
import type { User } from "@/types/user";
import { useForm } from "@tanstack/react-form";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import Image from "next/image";
import {
  X,
  FileText,
  Video,
  Image as ImageIcon,
  File,
  Sheet,
} from "lucide-react";
import { useCreatePostMutation } from "@/hooks/usePost";
import { getFileInfo, isImageType, isVideoType } from "@/lib/mediaUtils";

interface AddPostProps {
  currentUser: User;
}

interface MediaPreview {
  url: string;
  mimeType: string;
  name: string;
  file: File;
}

function AddPost({ currentUser }: AddPostProps) {
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const createPostMutation = useCreatePostMutation();

  const handleMediaChange = (files: FileList | null) => {
    if (!files) return;

    const newPreviews: MediaPreview[] = [];
    let processedCount = 0;

    Array.from(files).forEach((file) => {
      const fileInfo = getFileInfo(file.name, file.type);

      if (isImageType(fileInfo.type) || isVideoType(fileInfo.type)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          const preview: MediaPreview = {
            url,
            mimeType: file.type,
            name: file.name,
            file,
          };
          newPreviews.push(preview);
          processedCount++;

          if (processedCount === files.length) {
            setMediaPreviews((prev) => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const preview: MediaPreview = {
          url: "",
          mimeType: file.type,
          name: file.name,
          file,
        };
        newPreviews.push(preview);
        processedCount++;

        if (processedCount === files.length) {
          setMediaPreviews((prev) => [...prev, ...newPreviews]);
        }
      }
    });
  };

  const removeMedia = (index: number) => {
    setMediaPreviews((prev) => {
      const updated = prev.filter((_, i) => i !== index);

      // Always reset file input when removing files
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Update form field with remaining files
      form.setFieldValue(
        "media",
        updated.map((p) => p.file)
      );

      return updated;
    });
  };

  const form = useForm({
    defaultValues: {
      content: "",
      media: [] as File[],
      privacy_level: "public" as const,
    },
    // validators: {
    //   onSubmit: createPostSchema,
    // },
    onSubmit: async ({ value }) => {
      if (!currentUser) {
        toast.error("Vui lòng đăng nhập để đăng bài");
        return;
      }

      try {
        const validatedData = createPostSchema.safeParse(value);

        if (!validatedData.success) {
          const errors = validatedData.error.issues
            .map((err) => err.message)
            .join(", ");
          toast.error(`Dữ liệu không hợp lệ: ${errors}`);
          return;
        }

        // Sử dụng TanStack Query mutation để upload
        await createPostMutation.mutateAsync({
          content: value.content,
          privacy_level: value.privacy_level,
          media: mediaPreviews.map((p) => p.file),
        });

        toast.success("Bài viết đã được đưa vào hàng đợi!");

        // Reset form
        form.reset();
        setMediaPreviews([]);
      } catch (error) {
        console.error("Lỗi khi đăng bài:", error);
        toast.error(
          error instanceof Error ? error.message : "Có lỗi xảy ra khi đăng bài"
        );
      }
    },
  });

  const getFileIcon = (mimeType: string) => {
    const fileInfo = getFileInfo("", mimeType);
    switch (fileInfo.type) {
      case "image":
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case "video":
        return <Video className="w-5 h-5 text-purple-500" />;
      case "pdf":
        return <File className="w-5 h-5 text-red-500" />;
      case "word":
        return <FileText className="w-5 h-5 text-blue-600" />;
      case "excel":
        return <Sheet className="w-5 h-5 text-green-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Tạo bài viết mới</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Content Field */}
        <form.Field name="content">
          {(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung *
              </label>
              <textarea
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Bạn đang nghĩ gì?..."
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <div className="text-red-500">
                  {field.state.meta.errors.length > 0 &&
                    field.state.meta.errors.join(", ")}
                </div>
                <div>{field.state.value.length}/5000</div>
              </div>
            </div>
          )}
        </form.Field>

        {/* Media Upload */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Thêm media (tối đa 10 file)
            </label>
            {mediaPreviews.length > 0 && (
              <span className="text-sm text-blue-600 font-medium">
                {mediaPreviews.length} file
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.xltx"
            onChange={(e) => {
              handleMediaChange(e.target.files);
              // Update form field with files
              if (e.target.files) {
                form.setFieldValue("media", Array.from(e.target.files));
              }
            }}
            className="block w-full text-sm text-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Hỗ trợ ảnh, video, PDF, Word, Excel, Text (tối đa 50MB/file)
          </p>
        </div>

        {/* Media Previews */}
        {mediaPreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaPreviews.map((preview, index) => {
              const fileInfo = getFileInfo(preview.name, preview.mimeType);
              const isImage = isImageType(fileInfo.type);
              const isVideo = isVideoType(fileInfo.type);

              return (
                <div key={index} className="relative group">
                  {isImage && preview.url ? (
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : isVideo && preview.url ? (
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      <video
                        src={preview.url}
                        className="max-h-full max-w-full"
                        controls
                      />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg overflow-hidden bg-linear-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-3 border border-gray-300">
                      <div className="flex justify-center mb-2">
                        {getFileIcon(preview.mimeType)}
                      </div>
                      <p className="text-xs font-semibold text-gray-700 text-center line-clamp-2">
                        {preview.name}
                      </p>
                      <p className="text-xs text-gray-500 text-center mt-1">
                        {getFileInfo("", preview.mimeType).label}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Privacy Level */}
        <form.Field name="privacy_level">
          {(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quyền riêng tư
              </label>
              <select
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => field.handleChange(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">Công khai</option>
                <option value="friends">Bạn bè</option>
                <option value="private">Chỉ mình tôi</option>
              </select>
            </div>
          )}
        </form.Field>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
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
                    setMediaPreviews([]);
                  }}
                  disabled={
                    !canSubmit || isSubmitting || createPostMutation.isPending
                  }
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
                    ? "Đang đăng bài..."
                    : "Đăng bài"}
                </Button>
              </>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}

export default AddPost;
