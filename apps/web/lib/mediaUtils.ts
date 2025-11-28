/**
 * Utility để detect loại file và render media phù hợp
 */

export type MediaType =
  | "image"
  | "video"
  | "document"
  | "excel"
  | "word"
  | "pdf";

export interface FileInfo {
  type: MediaType;
  icon: string;
  label: string;
  extension: string;
}

const MEDIA_TYPE_CONFIG: Record<string, FileInfo> = {
  // Images
  "image/jpeg": {
    type: "image",
    icon: "🖼️",
    label: "JPEG Image",
    extension: ".jpg",
  },
  "image/png": {
    type: "image",
    icon: "🖼️",
    label: "PNG Image",
    extension: ".png",
  },
  "image/webp": {
    type: "image",
    icon: "🖼️",
    label: "WebP Image",
    extension: ".webp",
  },
  "image/gif": {
    type: "image",
    icon: "🖼️",
    label: "GIF Image",
    extension: ".gif",
  },
  "image/svg+xml": {
    type: "image",
    icon: "🖼️",
    label: "SVG Image",
    extension: ".svg",
  },

  // Videos
  "video/mp4": {
    type: "video",
    icon: "🎬",
    label: "MP4 Video",
    extension: ".mp4",
  },
  "video/webm": {
    type: "video",
    icon: "🎬",
    label: "WebM Video",
    extension: ".webm",
  },
  "video/ogg": {
    type: "video",
    icon: "🎬",
    label: "OGG Video",
    extension: ".ogg",
  },
  "video/quicktime": {
    type: "video",
    icon: "🎬",
    label: "MOV Video",
    extension: ".mov",
  },

  // Documents
  "application/pdf": {
    type: "pdf",
    icon: "📄",
    label: "PDF Document",
    extension: ".pdf",
  },
  "application/msword": {
    type: "word",
    icon: "📝",
    label: "Word Document",
    extension: ".doc",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    type: "word",
    icon: "📝",
    label: "Word Document",
    extension: ".docx",
  },
  "text/plain": {
    type: "document",
    icon: "📄",
    label: "Text File",
    extension: ".txt",
  },

  // Excel
  "application/vnd.ms-excel": {
    type: "excel",
    icon: "📊",
    label: "Excel Spreadsheet",
    extension: ".xls",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    type: "excel",
    icon: "📊",
    label: "Excel Spreadsheet",
    extension: ".xlsx",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
    type: "excel",
    icon: "📊",
    label: "Excel Template",
    extension: ".xltx",
  },
};

export function getFileInfo(url: string, mimeType?: string): FileInfo {
  // Nếu có mimeType, sử dụng nó
  if (mimeType && MEDIA_TYPE_CONFIG[mimeType]) {
    return MEDIA_TYPE_CONFIG[mimeType];
  }

  // Nếu không, guess từ URL extension
  const urlWithoutQuery = url.split("?")[0];
  const extension = urlWithoutQuery.split(".").pop()?.toLowerCase() || "";

  const extensionMap: Record<string, FileInfo> = {
    jpg: { type: "image", icon: "🖼️", label: "JPEG Image", extension: ".jpg" },
    jpeg: { type: "image", icon: "🖼️", label: "JPEG Image", extension: ".jpg" },
    png: { type: "image", icon: "🖼️", label: "PNG Image", extension: ".png" },
    webp: {
      type: "image",
      icon: "🖼️",
      label: "WebP Image",
      extension: ".webp",
    },
    gif: { type: "image", icon: "🖼️", label: "GIF Image", extension: ".gif" },
    svg: { type: "image", icon: "🖼️", label: "SVG Image", extension: ".svg" },
    mp4: { type: "video", icon: "🎬", label: "MP4 Video", extension: ".mp4" },
    webm: {
      type: "video",
      icon: "🎬",
      label: "WebM Video",
      extension: ".webm",
    },
    ogg: { type: "video", icon: "🎬", label: "OGG Video", extension: ".ogg" },
    mov: { type: "video", icon: "🎬", label: "MOV Video", extension: ".mov" },
    pdf: { type: "pdf", icon: "📄", label: "PDF Document", extension: ".pdf" },
    doc: {
      type: "word",
      icon: "📝",
      label: "Word Document",
      extension: ".doc",
    },
    docx: {
      type: "word",
      icon: "📝",
      label: "Word Document",
      extension: ".docx",
    },
    txt: {
      type: "document",
      icon: "📄",
      label: "Text File",
      extension: ".txt",
    },
    xls: {
      type: "excel",
      icon: "📊",
      label: "Excel Spreadsheet",
      extension: ".xls",
    },
    xlsx: {
      type: "excel",
      icon: "📊",
      label: "Excel Spreadsheet",
      extension: ".xlsx",
    },
    xltx: {
      type: "excel",
      icon: "📊",
      label: "Excel Template",
      extension: ".xltx",
    },
  };

  return (
    extensionMap[extension] || {
      type: "document",
      icon: "📎",
      label: "File",
      extension: `.${extension}`,
    }
  );
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
