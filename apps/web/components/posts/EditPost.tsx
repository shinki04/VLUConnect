/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import "@uppy/react/css/style.css";

import { PostResponse,privacyPost } from "@repo/shared/types/post";
import { createClient } from "@repo/supabase/client";
import AlertDialog from "@repo/ui/components/AlertDialog";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { Dropzone, FilesGrid, UppyContextProvider } from "@uppy/react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useUpdatePost } from "@/hooks/usePost";
import { useUppyWithSupabase } from "@/hooks/useUppy";
import {
  deleteSupabaseFile,
  getNewFiles,
  getRemovedFiles,
  loadRemoteFilesToUppy,
} from "@/lib/fileUtils";
import { validateContent } from "@/lib/validations/addPost-schema";

interface EditPostProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  post: PostResponse;
}

function EditPost({ open, onOpenChange, onConfirm, post }: EditPostProps) {
  const supabase = createClient();
  const uppy = useUppyWithSupabase("posts", "edit-post");
  const updatePostMutation = useUpdatePost();

  // Track original media URLs to detect deletions
  const originalMediaUrlsRef = useRef<string[]>([]);
  const filesLoadedRef = useRef(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const form = useForm({
    defaultValues: {
      content: post.content,
      privacy_level: post.privacy_level as privacyPost,
    },
    onSubmit: async ({ value }) => {
      try {
        toast.loading("Đang cập nhật bài viết...", { id: "update-post" });

        const currentFiles = uppy.getFiles();

        // 1. Identify removed files and delete from storage
        const removedFileUrls = getRemovedFiles(
          originalMediaUrlsRef.current,
          currentFiles
        );

        if (removedFileUrls.length > 0) {
          console.log("Deleting removed files:", removedFileUrls);
          const deletePromises = removedFileUrls.map((url) =>
            deleteSupabaseFile(url, "posts")
          );
          await Promise.all(deletePromises);
        }

        // 2. Upload new files
        const newFiles = getNewFiles(currentFiles);
        let newFileUrls: string[] = [];

        if (newFiles.length > 0) {
          console.log("Uploading new files:", newFiles.length);

          // Temporarily remove remote files from Uppy to avoid upload errors
          const remoteFiles = currentFiles.filter(
            (file) => file.meta.originalUrl || file.source === "remote"
          );
          const remoteFileIds = remoteFiles.map((f) => f.id);

          // Remove remote files temporarily
          remoteFileIds.forEach((id) => uppy.removeFile(id));

          try {
            // Upload only new files
            const result = await uppy.upload();

            if (!result || (result.failed && result.failed.length > 0)) {
              toast.error("Một số file upload thất bại", { id: "update-post" });
              // Restore remote files before returning
              for (const file of remoteFiles) {
                if (!file.data) continue;
                uppy.addFile({
                  id: file.id,
                  name: file.name,
                  type: file.type,
                  data: file.data,
                  source: file.source,
                  meta: file.meta,
                });
              }
              return;
            }

            // Get public URLs for newly uploaded files
            newFileUrls = (result.successful || []).map((file: any) => {
              const path = file.meta.objectName as string;
              const { data } = supabase.storage
                .from("posts")
                .getPublicUrl(path);
              return data.publicUrl;
            });
          } finally {
            // Always restore remote files
            for (const file of remoteFiles) {
              try {
                if (!file.data) continue;
                uppy.addFile({
                  id: file.id,
                  name: file.name,
                  type: file.type,
                  data: file.data,
                  source: file.source,
                  meta: file.meta,
                });
              } catch (e) {
                // File might already exist, ignore error
                console.warn("Could not restore file:", file.name, e);
              }
            }
          }
        }

        // 3. Build final media_urls array
        // Keep original files that weren't removed + add new files
        const keptOriginalUrls = originalMediaUrlsRef.current.filter(
          (url) => !removedFileUrls.includes(url)
        );
        const finalMediaUrls = [...keptOriginalUrls, ...newFileUrls];

        // 4. Update post
        await updatePostMutation.mutateAsync({
          postId: post.id,
          content: value.content,
          privacy_level: value.privacy_level,
          media_urls: finalMediaUrls,
        });

        toast.success("Cập nhật bài viết thành công", { id: "update-post" });

        // Reset and close
        filesLoadedRef.current = false;
        uppy.cancelAll();
        onOpenChange(false);
        onConfirm?.();
      } catch (error) {
        console.error("Error updating post:", error);
        toast.error(
          error instanceof Error ? error.message : "Có lỗi xảy ra khi cập nhật",
          { id: "update-post" }
        );
      }
    },
  });

  // Load existing files into Uppy when dialog opens
  useEffect(() => {
    if (open && !filesLoadedRef.current && post.media_urls) {
      filesLoadedRef.current = true;
      setIsLoadingFiles(true);

      // Store original URLs
      originalMediaUrlsRef.current = [...post.media_urls];

      // Load files into Uppy
      loadRemoteFilesToUppy(uppy, post.media_urls)
        .then(() => {
          setIsLoadingFiles(false);
        })
        .catch((error) => {
          console.error("Error loading files:", error);
          toast.error("Không thể tải một số file");
          setIsLoadingFiles(false);
        });
    }
  }, [open, post.media_urls, uppy]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      filesLoadedRef.current = false;
      uppy.cancelAll();
      form.reset();
    }
  }, [open, uppy, form]);

  const cancelEdited = () => {
    setOpenAlert(false);
    uppy.cancelAll();
    form.reset();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
            <DialogDescription>
              Cập nhật nội dung và media của bài viết
            </DialogDescription>
          </DialogHeader>

          <UppyContextProvider uppy={uppy}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-6"
            >
              {/* Loading State */}
              {isLoadingFiles && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    <p className="text-sm text-gray-500">
                      Đang tải files từ Supabase...
                    </p>
                  </div>
                </div>
              )}

              {/* Content Field */}
              <form.Field
                name="content"
                validators={{
                  onChange: ({ value }) => validateContent(value),
                }}
              >
                {(field) => (
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">
                      Nội dung
                    </label>
                    <Textarea
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={8}
                      className="w-full resize-none min-h-[250px]"
                      placeholder="Nội dung bài viết..."
                      disabled={isLoadingFiles}
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

              {/* Media Upload */}
              <div
                className={`
                  ${isLoadingFiles ? "opacity-50 pointer-events-none" : ""}
                `}
              >
                <label className="block text-sm font-medium mb-2">
                  Media (tối đa 10 file)
                </label>
                <div className="max-h-[300px] overflow-y-auto border rounded-xl border-dashed [&_.uppy-DropZone]:min-h-[80px] [&_.uppy-DropZone-container]:py-4 [&_.uppy-Root]:h-auto! bg-gray-50/50 dark:bg-slate-900/50">
                  <Dropzone />
                  <FilesGrid imageThumbnail columns={4} />
                </div>
              </div>

              {/* Privacy Level */}
              <form.Field name="privacy_level">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Quyền riêng tư
                    </label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v: privacyPost) =>
                        field.handleChange(v as privacyPost)
                      }
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

              <DialogFooter className="flex justify-end gap-3">
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpenAlert(true)}
                        disabled={isSubmitting || isLoadingFiles}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          !canSubmit ||
                          isSubmitting ||
                          updatePostMutation.isPending ||
                          isLoadingFiles
                        }
                      >
                        {isSubmitting || updatePostMutation.isPending
                          ? "Đang cập nhật..."
                          : "Lưu thay đổi"}
                      </Button>
                    </>
                  )}
                </form.Subscribe>
              </DialogFooter>
            </form>
          </UppyContextProvider>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={openAlert}
        onOpenChange={setOpenAlert}
        description="Bạn chắc chắn muốn thoát khi không lưu chứ?"
        onConfirm={cancelEdited}
      />
    </>
  );
}

export default EditPost;
