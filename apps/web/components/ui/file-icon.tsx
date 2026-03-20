import { FileSpreadsheet, FileText, FileType, File } from "lucide-react";
import React from "react";

import { getFileInfo, type MediaType } from "@/lib/mediaUtils";

interface FileIconProps {
  url?: string;
  type?: MediaType;
  className?: string;
}

export function FileIcon({ url, type, className = "w-8 h-8" }: FileIconProps) {
  const actualType = type || (url ? getFileInfo(url).type : "document");

  switch (actualType) {
    case "pdf":
    case "document":
      return <FileText className={className} />;
    case "word":
      return <FileType className={className} />;
    case "excel":
      return <FileSpreadsheet className={className} />;
    default:
      return <File className={className} />;
  }
}
