"use client";

import { createClient } from "@repo/supabase/client";
import Uppy from "@uppy/core";
import Vietnamese from "@uppy/locales/lib/vi_VN";
import Tus from "@uppy/tus";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const useUppyWithSupabase = (bucketName: string, instanceId?: string) => {
  const supabase = createClient();
  const initialized = useRef(false); // Track initialization

  const [uppy] = useState(
    () =>
      new Uppy({
        id: instanceId, // Set unique ID for each instance
        locale: Vietnamese,
        autoProceed: false,
        restrictions: {
          maxFileSize: 10 * 1024 * 1024,
          maxNumberOfFiles: 10,
          allowedFileTypes: [
            "image/*",
            "video/*",
            ".pdf",
            ".doc",
            ".docx",
            ".txt",
            ".xls",
            ".xlsx",
            ".xltx",
          ],
        },
      })
  );

  useEffect(() => {
    // Prevent double initialization
    if (initialized.current) return;
    initialized.current = true;

    const initializeUppy = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Check if Tus plugin already exists before adding
      if (!uppy.getPlugin("Tus")) {
        uppy.use(Tus, {
          id: "Tus", // Explicitly set ID
          endpoint: `https://${process.env.NEXT_PUBLIC_SUPABASE_ID!}.storage.supabase.co/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: 6 * 1024 * 1024,
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          headers: {
            authorization: `Bearer ${session?.access_token ?? ""}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          allowedMetaFields: [
            "bucketName",
            "objectName",
            "contentType",
            "cacheControl",
            "metadata",
          ],
          onError: (error) => console.error("Upload error:", error),
        });
      }

      uppy
        .on("file-added", (file) => {
          // Skip setting upload metadata for remote files (already in storage)
          // Remote files have source: "remote" or meta.originalUrl set
          const isRemoteFile = file.source === "remote" || file.meta.originalUrl;
          
          if (isRemoteFile) {
            // Preserve remote file metadata, don't set upload fields
            return;
          }

          // Only set upload metadata for new files
          // Keep original filename, use unique folder to avoid duplicates
          const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const uniqueName = `${session?.user.id}/${uniqueId}/${file.name}`;

          file.meta = {
            ...file.meta,
            bucketName,
            objectName: uniqueName,
            contentType: file.type || "application/octet-stream",
          };
        })
        .on("restriction-failed", (file, error) => {
          if (error && error.message.includes("exceeds maximum size")) {
            toast.error(`File "${file!.name}" vượt quá 10MB!`);
          } else {
            toast.error(error?.message || `File "${file!.name}" không hợp lệ`);
          }
        });
    };

    initializeUppy();

    // Cleanup on unmount
    return () => {
      uppy.cancelAll();
    };
  }, [uppy, bucketName, supabase]);

  return uppy;
};
