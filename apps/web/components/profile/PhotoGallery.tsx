import Image from "next/image";
import React from "react";

interface PhotoGalleryProps {
  photos: { url: string; postId: string }[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {photos.map((item, index) => (
        <div
          key={`${item.postId}-${index}`}
          className="relative aspect-square w-full rounded-md overflow-hidden bg-dashboard-background border border-dashboard-border shadow-sm hover:opacity-90 transition-opacity"
        >
          {/* Link to post temporarily commented out until post modal is ready, or to the post page if it exists. Reverting to just viewing the image for now. */}
          <Image
            src={item.url}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
            alt={`User photo ${index}`}
          />
        </div>
      ))}
    </div>
  );
}
