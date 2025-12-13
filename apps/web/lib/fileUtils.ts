/* eslint-disable @typescript-eslint/no-explicit-any */
import type Uppy from "@uppy/core";

import { createClient } from "@/lib/supabase/client";

/**
 * Extract storage path from Supabase public URL
 * Example: https://xxx.supabase.co/storage/v1/object/public/posts/user123/file.jpg
 * Returns: user123/file.jpg
 */
export function extractStoragePath(
  publicUrl: string,
  bucketName: string
): string | null {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split("/");
    const bucketIndex = pathParts.indexOf(bucketName);

    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      return null;
    }

    // Get everything after the bucket name
    const storagePath = pathParts.slice(bucketIndex + 1).join("/");
    return storagePath;
  } catch (error) {
    console.error("Error extracting storage path:", error);
    return null;
  }
}

/**
 * Delete file from Supabase storage
 */
export async function deleteSupabaseFile(
  publicUrl: string,
  bucketName: string = "posts"
): Promise<boolean> {
  const supabase = createClient();
  const storagePath = extractStoragePath(publicUrl, bucketName);

  if (!storagePath) {
    console.error("Could not extract storage path from URL:", publicUrl);
    return false;
  }

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([storagePath]);

    if (error) {
      console.error("Error deleting file from storage:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteSupabaseFile:", error);
    return false;
  }
}

/**
 * Load remote file into Uppy
 * Fetches the file from URL and adds it to Uppy instance
 */
export async function loadRemoteFileToUppy(
  uppy: Uppy,
  fileUrl: string,
  fileName?: string
): Promise<any> {
  try {
    // Fetch the file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const contentType =
      response.headers.get("content-type") ||
      blob.type ||
      "application/octet-stream";

    // Extract filename from URL if not provided
    const urlFileName =
      fileName || fileUrl.split("/").pop()?.split("?")[0] || "file";

    // Create File from Blob
    const file = new File([blob], urlFileName, { type: contentType });

    // Add to Uppy - returns file ID
    const fileId = uppy.addFile({
      name: file.name,
      type: file.type,
      data: file,
      source: "remote",
      meta: {
        // Store original URL to track which files were pre-existing
        originalUrl: fileUrl,
      },
    });

    // Get the file object from Uppy
    return uppy.getFile(fileId);
  } catch (error) {
    console.error("Error loading remote file to Uppy:", error);
    return null;
  }
}

/**
 * Load multiple remote files into Uppy
 */
export async function loadRemoteFilesToUppy(
  uppy: Uppy,
  fileUrls: string[]
): Promise<void> {
  const promises = fileUrls.map((url) => loadRemoteFileToUppy(uppy, url));
  await Promise.all(promises);
}

/**
 * Get the list of files that were removed from Uppy
 * Compares original URLs with current Uppy files
 */
export function getRemovedFiles(
  originalUrls: string[],
  uppyFiles: any[]
): string[] {
  const currentOriginalUrls = uppyFiles
    .filter((file) => file.meta.originalUrl)
    .map((file) => file.meta.originalUrl as string);

  // Files that were in original list but not in current Uppy files
  return originalUrls.filter((url) => !currentOriginalUrls.includes(url));
}

/**
 * Get the list of newly added files (not from original URLs)
 */
export function getNewFiles(uppyFiles: any[]): any[] {
  return uppyFiles.filter((file) => !file.meta.originalUrl);
}
