// "use client";
// import { createClient } from "@/lib/supabase/client";
// import Uppy from "@uppy/core";
// import Tus from "@uppy/tus";
// import { useEffect, useRef } from "react";
// import { useState } from "react";
// import Vietnamese from "@uppy/locales/lib/vi_VN";

// interface UseUppyOptions {
//   bucketName: string;
//   onUploadSuccess?: (files: UploadedFile[]) => void;
//   onUploadError?: (error: Error) => void;
// }

// export interface UploadedFile {
//   id: string;
//   name: string;
//   url: string;
//   publicUrl: string;
//   path: string;
//   size: number;
//   type: string;
// }

// /**
//  * Custom hook for configuring Uppy with Supabase authentication and TUS resumable uploads
//  * @param {Object} options - Configuration options for the Uppy instance.
//  * @param {string} options.bucketName - The bucket name in Supabase where files are stored.
//  * @returns {Object} uppy - Uppy instance with configured upload settings.
//  */
// export const useUppyWithSupabase = ({
//   bucketName,
//   onUploadSuccess,
//   onUploadError,
// }: UseUppyOptions) => {
//   // Initialize Supabase client with project URL and anon key
//   const supabase = createClient();
//   const isInitialized = useRef(false);

//   // Initialize Uppy instance only once
//   const [uppy] = useState(
//     () =>
//       new Uppy({
//         locale: Vietnamese,
//         autoProceed: false,
//         restrictions: {
//           maxFileSize: 10 * 1024 * 1024, // 10MB/file
//           maxNumberOfFiles: 10, // 10 files max
//           allowedFileTypes: [
//             "image/*",
//             "video/*",
//             ".pdf",
//             ".doc",
//             ".docx",
//             ".txt",
//             ".xls",
//             ".xlsx",
//             ".xltx",
//           ],
//         },
//       })
//   );

//   useEffect(() => {
//     if (isInitialized.current) return;

//     const initializeUppy = async () => {
//       // Retrieve the current user's session for authentication
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();
//       uppy
//         .use(Tus, {
//           // Supabase TUS endpoint (with direct storage hostname)
//           endpoint: `${process.env
//             .NEXT_PUBLIC_SUPABASE_URL!}/storage/v1/upload/resumable`,
//           retryDelays: [0, 3000, 5000, 10000, 20000], // Retry delays for resumable uploads
//           headers: {
//             authorization: `Bearer ${session?.access_token}`, // User session access token
//             apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // API key for Supabase
//           },
//           uploadDataDuringCreation: true, // Send metadata with file chunks
//           removeFingerprintOnSuccess: true, // Remove fingerprint after successful upload
//           chunkSize: 6 * 1024 * 1024, // Chunk size for TUS uploads (6MB)
//           allowedMetaFields: [
//             "bucketName",
//             "objectName",
//             "contentType",
//             "cacheControl",
//             "metadata",
//           ], // Metadata fields allowed for the upload
//           onError: (error) => console.error("Upload error:", error), // Error handling for uploads
//         })
//         .on("file-added", (file) => {
//           // Generate unique filename to avoid conflicts
//           const timestamp = Date.now();
//           const randomStr = Math.random().toString(36).substring(2, 9);
//           const extension = file.name.split(".").pop();
//           const uniqueName = `${timestamp}-${randomStr}.${extension}`;

//           // Attach metadata to each file, including bucket name and content type
//           file.meta = {
//             ...file.meta,
//             bucketName, // Bucket specified by the user of the hook
//             objectName: uniqueName, // Use file name as object name
//             contentType: file.type, // Set content type based on file MIME type
//             // metadata: JSON.stringify({
//             //   // custom metadata passed to the user_metadata column
//             //   yourCustomMetadata: true,
//             // }),
//           };
//         })
//         .on("upload-success", async (file, response) => {
//           console.log("Upload success:", file?.name);
//         })
//         .on("complete", async (result) => {
//           if (result.successful!.length > 0) {
//             try {
//               // Get public URLs for all uploaded files
//               const uploadedFiles: UploadedFile[] = await Promise.all(
//                 result.successful!.map(async (file) => {
//                   const path = file.meta.objectName as string;

//                   // Get public URL
//                   const {
//                     data: { publicUrl },
//                   } = supabase.storage.from(bucketName).getPublicUrl(path);

//                   return {
//                     id: file.id,
//                     name: file.name,
//                     url: publicUrl,
//                     publicUrl,
//                     path,
//                     size: file.size ?? 0,
//                     type: file.type || "application/octet-stream",
//                   };
//                 })
//               );

//               onUploadSuccess?.(uploadedFiles);
//             } catch (error) {
//               console.error("Error getting public URLs:", error);
//               onUploadError?.(
//                 error instanceof Error
//                   ? error
//                   : new Error("Lỗi khi lấy URL của file")
//               );
//             }
//           }
//         })
//         .on("upload-error", (file, error) => {
//           console.error("Upload error:", file?.name, error);
//           onUploadError?.(
//             new Error(`Lỗi upload ${file?.name}: ${error.message}`)
//           );
//         });

//       isInitialized.current = true;
//     };

//     // Initialize Uppy with Supabase settings
//     initializeUppy();
//   }, [uppy, bucketName]);
//   // Return the configured Uppy instance
//   return uppy;
// };

"use client";

import { createClient } from "@/lib/supabase/client";
import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import { useEffect } from "react";
import { useState } from "react";
import Vietnamese from "@uppy/locales/lib/vi_VN";
import { toast } from "sonner";

export const useUppyWithSupabase = (bucketName: string) => {
  const supabase = createClient();

  const [uppy] = useState(
    () =>
      new Uppy({
        locale: Vietnamese,
        autoProceed: false, // quan trọng: không tự upload
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
    const initializeUppy = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      uppy
        .use(Tus, {
          endpoint: `${process.env
            .NEXT_PUBLIC_SUPABASE_URL!}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: 6 * 1024 * 1024,
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          // Headers lấy mới mỗi request → tránh token hết hạn
          headers: {
            authorization: `Bearer ${session?.access_token ?? ""}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          allowedMetaFields: ["bucketName", "objectName", "contentType"],
        })
        .on("file-added", (file) => {
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 9);
          const extension = file.name.split(".").pop() || "";
          const uniqueName = `${session?.user.id}/${timestamp}-${randomStr}.${extension}`;
          const filesLength = uppy.getFiles().length;

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
  }, [uppy, bucketName]);

  return uppy;
};
