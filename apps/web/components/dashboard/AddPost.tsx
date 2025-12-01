"use client";
import { privacyPost } from "@repo/shared/types/post";
import { useForm } from "@tanstack/react-form";
import {
  File,
  FileText,
  Image as ImageIcon,
  Sheet,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePostMutation } from "@/hooks/usePost";
import { getFileInfo, isImageType, isVideoType } from "@/lib/mediaUtils";
import {
  validateContent,
  validateMedia,
} from "@/lib/validations/addPost-schema";
import type { User } from "@repo/shared/types/user";

import { Button } from "../ui/button";
import { Card } from "../ui/card";

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
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));

    // Always reset file input when removing files
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

      try {
        // Sử dụng TanStack Query mutation để upload
        await createPostMutation.mutateAsync({
          content: value.content,
          privacy_level: value.privacy_level,
          media: mediaPreviews.map((p) => p.file),
        });

        // Reset form - Realtime will show success toast
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

  // Update form media field when mediaPreviews changes
  useEffect(() => {
    form.setFieldValue(
      "media",
      mediaPreviews.map((p) => p.file)
    );
  }, [mediaPreviews, form]);

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
    <Card className=" rounded-lg shadow p-6 my-6">
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
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2  resize-none"
                placeholder="Bạn đang nghĩ gì?..."
                required
              />

              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <div className="text-red-500">
                  {field.state.meta.errors &&
                    field.state.meta.errors.join(", ")}
                </div>
                <div>{field.state.value.length}/5000</div>
              </div>
            </div>
          )}
        </form.Field>

        {/* Media Upload */}
        <form.Field
          name="media"
          validators={{
            onChange: ({ value }) => validateMedia(value),
          }}
        >
          {(field) => (
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
                    field.handleChange(Array.from(e.target.files));
                  }
                }}
                className="block w-full text-sm text-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Hỗ trợ ảnh, video, PDF, Word, Excel, Text (tối đa 10MB/file)
              </p>
              {field.state.meta.errors && (
                <p className="text-red-500 text-sm mt-1">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

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

              <Select
                // Nhận giá trị từ form
                value={field.state.value}
                onOpenChange={(open) => {
                  if (!open) field.handleBlur();
                }}
                onValueChange={(value) =>
                  field.handleChange(value as privacyPost)
                }
              >
                <SelectTrigger id="privacy-level" className="w-full">
                  <SelectValue placeholder="Chọn quyền riêng tư" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Chọn quyền riêng tư cho bài viết</SelectLabel>
                    <SelectItem value="public">Công khai</SelectItem>
                    <SelectItem value="friends">Bạn bè</SelectItem>
                    <SelectItem value="private">Chỉ mình tôi</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {/* Hiển thị lỗi nếu cần */}
              {field.state.meta.errors && field.state.meta.isTouched && (
                <p className="text-red-500 text-sm mt-1">
                  {field.state.meta.errors}
                </p>
              )}
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
    </Card>
  );
}

export default AddPost;
