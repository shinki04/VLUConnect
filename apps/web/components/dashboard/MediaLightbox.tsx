"use client";

import React from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface MediaLightboxProps {
  imageUrl: string;
  allImageUrls: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function MediaLightbox({
  imageUrl,
  allImageUrls,
  currentIndex,
  onClose,
  onNavigate,
}: MediaLightboxProps) {
  const handlePrevious = () => {
    if (currentIndex === 0) {
      onNavigate(allImageUrls.length - 1);
    } else {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex === allImageUrls.length - 1) {
      onNavigate(0);
    } else {
      onNavigate(currentIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrevious();
    } else if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Main image */}
        <div className="relative w-full h-full max-w-5xl max-h-screen flex items-center justify-center">
          <Image
            src={imageUrl}
            alt="Full screen image"
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {/* Navigation buttons */}
        {allImageUrls.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
          {currentIndex + 1} / {allImageUrls.length}
        </div>

        {/* Thumbnail strip */}
        {allImageUrls.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/40 p-3 rounded-lg max-w-3xl overflow-x-auto">
            {allImageUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => onNavigate(index)}
                className={`relative w-12 h-12 rounded shrink-0 overflow-hidden transition-all ${
                  index === currentIndex
                    ? "ring-2 ring-white scale-110"
                    : "opacity-60 hover:opacity-100"
                }`}
                aria-label={`Ảnh ${index + 1}`}
              >
                <Image
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
