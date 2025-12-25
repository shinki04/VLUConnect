/**
 * Media utility functions for admin dashboard
 * Similar to web app's mediaUtils
 */

export type MediaType = "image" | "video" | "document" | "excel" | "word" | "pdf";

export interface FileInfo {
  type: MediaType;
  extension: string;
  label: string;
}

const EXTENSION_MAP: Record<string, FileInfo> = {
  // Images
  jpg: { type: "image", extension: ".jpg", label: "JPEG Image" },
  jpeg: { type: "image", extension: ".jpeg", label: "JPEG Image" },
  png: { type: "image", extension: ".png", label: "PNG Image" },
  webp: { type: "image", extension: ".webp", label: "WebP Image" },
  gif: { type: "image", extension: ".gif", label: "GIF Image" },
  svg: { type: "image", extension: ".svg", label: "SVG Image" },
  // Videos
  mp4: { type: "video", extension: ".mp4", label: "MP4 Video" },
  webm: { type: "video", extension: ".webm", label: "WebM Video" },
  ogg: { type: "video", extension: ".ogg", label: "OGG Video" },
  mov: { type: "video", extension: ".mov", label: "MOV Video" },
  avi: { type: "video", extension: ".avi", label: "AVI Video" },
  mkv: { type: "video", extension: ".mkv", label: "MKV Video" },
  // Documents
  pdf: { type: "pdf", extension: ".pdf", label: "PDF Document" },
  doc: { type: "word", extension: ".doc", label: "Word Document" },
  docx: { type: "word", extension: ".docx", label: "Word Document" },
  txt: { type: "document", extension: ".txt", label: "Text File" },
  xls: { type: "excel", extension: ".xls", label: "Excel Spreadsheet" },
  xlsx: { type: "excel", extension: ".xlsx", label: "Excel Spreadsheet" },
};

export function getFileInfo(url: string): FileInfo {
  const urlWithoutQuery = url.split("?")[0];
  const extension = urlWithoutQuery?.split(".").pop()?.toLowerCase() || "";
  
  return EXTENSION_MAP[extension] || {
    type: "document",
    extension: `.${extension}`,
    label: "File",
  };
}

export function isImageType(type: MediaType): boolean {
  return type === "image";
}

export function isVideoType(type: MediaType): boolean {
  return type === "video";
}

export function isDocumentType(type: MediaType): boolean {
  return ["document", "pdf", "word", "excel"].includes(type);
}

export function getFileName(url: string): string {
  const urlWithoutQuery = url.split("?")[0];
  return urlWithoutQuery?.split("/").pop() || "File";
}
