"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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
  const imageUrls = mediaUrls.filter((url) => {
    // Filter to show only image URLs (check by extension or if it looks like an image)
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
    return (
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "") ||
      url.includes("/image") ||
      url.includes("/img")
    );
  });

  const handlePrevious = () => {
    if (imageUrls.length === 0) return;
    setSelectedIndex((prev) =>
      prev === null || prev === 0 ? imageUrls.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    if (imageUrls.length === 0) return;
    setSelectedIndex((prev) =>
      prev === null || prev === imageUrls.length - 1 ? 0 : prev + 1
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
            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image */}
          <div className="relative w-full h-full max-w-4xl max-h-screen">
            <Image
              src={imageUrls[selectedIndex]}
              alt={`Image ${selectedIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Navigation */}
          {imageUrls.length > 1 && (
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
            {selectedIndex + 1} / {imageUrls.length}
          </div>
        </div>
      </div>
    );
  }

  // Gallery grid mode
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Bài viết</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Post content */}
            <div>
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                {postContent}
              </p>
            </div>

            {/* Gallery grid */}
            {imageUrls.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-600 mb-3">
                  HÌNH ẢNH ({imageUrls.length})
                </p>
                <div
                  className={`grid gap-3 ${
                    imageUrls.length === 1
                      ? "grid-cols-1"
                      : imageUrls.length === 2
                      ? "grid-cols-2"
                      : imageUrls.length === 3
                      ? "grid-cols-3"
                      : "grid-cols-4"
                  }`}
                >
                  {imageUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedIndex(index)}
                    >
                      <Image
                        src={url}
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
          </div>
        </div>
      </div>
    </div>
  );
}
