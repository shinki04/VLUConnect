"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

import {
  getFileInfo,
  isDocumentType,
  isImageType,
  isVideoType,
} from "@/lib/mediaUtils";

import { FileIcon } from "../ui/file-icon";

interface MediaGalleryModalProps {
  mediaUrls: string[];
  postContent: string;
  onClose: () => void;
}

export default function MediaGalleryModal({
  mediaUrls,
  postContent,
  onClose,
}: MediaGalleryModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Categorize media by type
  const images = mediaUrls
    .map((url, index) => ({ url, index, type: getFileInfo(url).type }))
    .filter((item) => isImageType(item.type));

  const videos = mediaUrls
    .map((url, index) => ({ url, index, type: getFileInfo(url).type }))
    .filter((item) => isVideoType(item.type));

  const documents = mediaUrls
    .map((url, index) => ({ url, index, type: getFileInfo(url).type }))
    .filter((item) => isDocumentType(item.type));

  const handleDownload = (url: string) => {
    const fileName = url.split("/").pop()?.split("?")[0] || "download";
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrevious = () => {
    if (images.length === 0) return;
    setSelectedIndex((prev) =>
      prev === null || prev === 0 ? images.length - 1 : prev - 1,
    );
  };

  const handleNext = () => {
    if (images.length === 0) return;
    setSelectedIndex((prev) =>
      prev === null || prev === images.length - 1 ? 0 : prev + 1,
    );
  };

  // Lightbox mode
  if (selectedIndex !== null) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        onClick={onClose}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 /20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image */}
          <div className="relative w-full h-full max-w-4xl max-h-screen">
            <Image
              src={images[selectedIndex]?.url || ""}
              alt={`Image ${selectedIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      </div>
    );
  }

  // Gallery grid mode
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl w-full max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden "
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b space-y-0">
          <DialogTitle className="text-lg font-semibold">Bài viết</DialogTitle>
          <button
            onClick={onClose}
            className=" rounded-full p-1 focus:outline-none hover:bg-mainred-hover/60"
          >
            <X className="w-6 h-6" />
          </button>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Post content */}
            <div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {postContent}
              </p>
            </div>

            {/* Images Gallery */}
            {images.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-600 mb-3">
                  HÌNH ẢNH ({images.length})
                </p>
                <div
                  className={`grid gap-3 ${
                    images.length === 1
                      ? "grid-cols-1"
                      : images.length === 2
                        ? "grid-cols-2"
                        : images.length === 3
                          ? "grid-cols-3"
                          : "grid-cols-4"
                  }`}
                >
                  {images.map((item, index) => (
                    <div
                      key={index}
                      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedIndex(index)}
                    >
                      <Image
                        src={item.url}
                        alt={`Gallery image ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Gallery */}
            {videos.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-600 mb-3">
                  VIDEO ({videos.length})
                </p>
                <div
                  className={`grid gap-3 ${
                    videos.length === 1
                      ? "grid-cols-1"
                      : videos.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-3"
                  }`}
                >
                  {videos.map((item, index) => (
                    <div
                      key={index}
                      className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden"
                    >
                      <video
                        src={item.url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents Gallery */}
            {documents.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-600 mb-3">
                  TÀI LIỆU ({documents.length})
                </p>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                  {documents.map((item, index) => {
                    const fileInfo = getFileInfo(item.url);
                    const fileName =
                      item.url.split("/").pop()?.split("?")[0] || "File";
                    return (
                      <div
                        key={index}
                        className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 hover:from-blue-100 hover:to-indigo-200 transition-all duration-200"
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          {/* Icon */}
                          <div className="text-blue-600">
                            <FileIcon type={fileInfo.type} className="w-8 h-8" />
                          </div>

                          {/* Extension Badge */}
                          <span className="inline-block bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            {fileInfo.extension}
                          </span>

                          {/* File Name */}
                          <p className="text-xs text-gray-700 font-medium line-clamp-2 w-full">
                            {fileName}
                          </p>

                          {/* Download Button */}
                          <button
                            onClick={() => handleDownload(item.url)}
                            className="mt-2 inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            Tải xuống
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
