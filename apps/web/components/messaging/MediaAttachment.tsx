"use client";

import type { PendingFile } from "@repo/shared/types/messaging";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import {
  Download,
  File,
  FileArchive,
  FileAudio,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  X,
} from "lucide-react";
import { memo, useState } from "react";

// Simple Progress component
function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("w-full bg-muted rounded-full overflow-hidden", className)}>
      <div 
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// Format file size utility
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface MediaAttachmentProps {
  // For pending files (uploading)
  pendingFile?: PendingFile;
  // For completed files (from media_urls)
  url?: string;
  // Is this the sender's own message
  isOwn?: boolean;
  // Remove handler for pending files
  onRemove?: (fileId: string) => void;
}

/**
 * Renders media attachment in message bubble
 * - Pending files: Shows upload progress
 * - Completed files: Shows preview + download
 */
export const MediaAttachment = memo(function MediaAttachment({
  pendingFile,
  url,
  isOwn = false,
  onRemove,
}: MediaAttachmentProps) {
  const [imageError, setImageError] = useState(false);

  // Determine file info
  const fileUrl = pendingFile?.localPreview || pendingFile?.url || url;
  const fileName = pendingFile?.name || getFileNameFromUrl(url);
  const fileType = pendingFile?.type || getMimeTypeFromUrl(url);
  const fileSize = pendingFile?.size;
  const isUploading = pendingFile?.status === "uploading";
  const isFailed = pendingFile?.status === "failed";
  const progress = pendingFile?.progress ?? 100;

  // Categorize file type
  const isImage = fileType?.startsWith("image/");
  const isVideo = fileType?.startsWith("video/");
  const isAudio = fileType?.startsWith("audio/");

  // Render image attachment
  if (isImage && fileUrl && !imageError) {
    return (
      <div className="relative group rounded-lg overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl}
          alt={fileName || "Image"}
          className={cn(
            "max-w-[200px] max-h-[200px] w-auto h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover",
            isUploading && "opacity-50"
          )}
          onError={() => setImageError(true)}
          onClick={() => {
            if (!isUploading && url) {
              window.open(url, "_blank");
            }
          }}
        />
        
        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white mb-2" />
            <span className="text-white text-sm font-medium">{progress}%</span>
          </div>
        )}

        {/* Failed overlay */}
        {isFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/40">
            <span className="text-white text-sm">Upload thất bại</span>
          </div>
        )}

        {/* Remove button */}
        {pendingFile && onRemove && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(pendingFile.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // Render video attachment
  if (isVideo && fileUrl) {
    return (
      <div className="relative group rounded-lg overflow-hidden max-w-[250px]">
        <video
          src={fileUrl}
          controls
          preload="metadata"
          className={cn(
            "max-w-full max-h-[180px] rounded-lg",
            isUploading && "opacity-50"
          )}
          onError={() => console.error("Video load error")}
        />

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white mb-2" />
            <span className="text-white text-sm font-medium">{progress}%</span>
          </div>
        )}

        {/* File name */}
        <p className={cn(
          "text-xs mt-1 truncate",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {fileName}
        </p>

        {/* Remove button */}
        {pendingFile && onRemove && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(pendingFile.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // Render generic file attachment (documents, audio, etc.)
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg min-w-[200px] max-w-[300px]",
        isOwn ? "bg-primary-foreground/10" : "bg-background/50",
        isUploading && "opacity-70"
      )}
    >
      {/* File icon */}
      <div
        className={cn(
          "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
          isOwn ? "bg-primary-foreground/20" : "bg-muted"
        )}
      >
        {getFileIcon(fileType)}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isOwn ? "text-primary-foreground" : "text-foreground"
          )}
        >
          {fileName || "File"}
        </p>

        {/* Size + Progress */}
        <div className="flex items-center gap-2 mt-0.5">
          {fileSize && (
            <span
              className={cn(
                "text-xs",
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
              {formatFileSize(fileSize)}
            </span>
          )}

          {isUploading && (
            <>
              <span className={cn(
                "text-xs",
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                •
              </span>
              <span className={cn(
                "text-xs",
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                {progress}%
              </span>
            </>
          )}
        </div>

        {/* Progress bar */}
        {isUploading && (
          <Progress value={progress} className="h-1 mt-1.5" />
        )}
      </div>

      {/* Action buttons */}
      <div className="shrink-0">
        {isUploading ? (
          pendingFile && onRemove ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onRemove(pendingFile.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )
        ) : url ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            asChild
          >
            <a href={url} download={fileName} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
});

// Helper functions
function getFileNameFromUrl(url?: string): string {
  if (!url) return "File";
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1] || "File");
  } catch {
    return "File";
  }
}

function getMimeTypeFromUrl(url?: string): string {
  if (!url) return "application/octet-stream";
  const ext = url.split(".").pop()?.toLowerCase();
  
  const mimeMap: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    // Videos
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    // Archives
    zip: "application/zip",
    rar: "application/vnd.rar",
    "7z": "application/x-7z-compressed",
  };

  return mimeMap[ext || ""] || "application/octet-stream";
}

function getFileIcon(mimeType?: string) {
  if (!mimeType) return <File className="h-5 w-5" />;

  if (mimeType.startsWith("image/")) return <ImageIcon className="h-5 w-5" />;
  if (mimeType.startsWith("video/")) return <FileVideo className="h-5 w-5" />;
  if (mimeType.startsWith("audio/")) return <FileAudio className="h-5 w-5" />;
  if (mimeType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FileText className="h-5 w-5 text-blue-500" />;
  if (mimeType.includes("sheet") || mimeType.includes("excel"))
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z"))
    return <FileArchive className="h-5 w-5 text-yellow-500" />;

  return <File className="h-5 w-5" />;
}