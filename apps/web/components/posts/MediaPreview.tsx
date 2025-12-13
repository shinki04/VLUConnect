import { FileSpreadsheet, FileText, FileType } from "lucide-react";
import Image from "next/image";

import {
  getFileInfo,
  isImageType,
  isVideoType,
  type MediaType,
} from "@/lib/mediaUtils";
interface PostMediaGalleryProps {
  mediaUrls?: string[] | null;
  onMediaClick: (url: string, index: number, isMoreMedia: boolean) => void;
}

const FILE_ICON_MAP = {
  pdf: FileText,
  document: FileText,
  word: FileType,
  excel: FileSpreadsheet,
} as const;

function getFileIconComponent(type: MediaType) {
  const IconComponent =
    FILE_ICON_MAP[type as keyof typeof FILE_ICON_MAP] || FileText;
  return <IconComponent className="w-8 h-8" />;
}

function getGridCols(count: number): string {
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  return "grid-cols-2 md:grid-cols-3";
}

export default function PostMediaGallery({
  mediaUrls,
  onMediaClick,
}: PostMediaGalleryProps) {
  if (!mediaUrls || mediaUrls.length === 0) return null;

  return (
    <div className={`grid gap-2 mb-3 ${getGridCols(mediaUrls.length)}`}>
      {mediaUrls.slice(0, 4).map((url, index) => (
        <MediaItem
          key={index}
          url={url}
          index={index}
          isMoreMedia={mediaUrls.length > 4 && index === 3}
          remainingCount={mediaUrls.length - 4}
          onClick={onMediaClick}
        />
      ))}
    </div>
  );
}

interface MediaItemProps {
  url: string;
  index: number;
  isMoreMedia: boolean;
  remainingCount: number;
  onClick: (url: string, index: number, isMoreMedia: boolean) => void;
}

function MediaItem({
  url,
  index,
  isMoreMedia,
  remainingCount,
  onClick,
}: MediaItemProps) {
  const fileInfo = getFileInfo(url);
  const isImage = isImageType(fileInfo.type);
  const isVideo = isVideoType(fileInfo.type);

  return (
    <div
      className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden group cursor-pointer"
      onClick={() => onClick(url, index, isMoreMedia)}
    >
      {isImage ? (
        <Image
          src={url}
          alt={`Post media ${index + 1}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : isVideo ? (
        <>
          <video src={url} className="w-full h-full object-cover" controls />
          {/* <MediaPlayer.Root
            className="w-full h-full object-cover"
            onFullscreenChange={(isFullscreen: Boolean) => {
              console.log(isFullscreen);
            }}
          >
            <MediaPlayer.Video>
              <source src={url} type="video/mp4" />
            </MediaPlayer.Video>
            <MediaPlayer.Controls className="flex-col items-start">
              <MediaPlayer.ControlsOverlay />
              <MediaPlayer.Seek />
              <div className="flex w-full items-center ">
                <div className="flex flex-1 items-center ">
                  <MediaPlayer.Play /> */}
          {/* <MediaPlayer.SeekBackward />
                  <MediaPlayer.SeekForward /> */}
          {/* <MediaPlayer.Volume expandable />
                  <MediaPlayer.Time />
                </div>
                <div className="flex items-center "> */}
          {/* <MediaPlayer.PlaybackSpeed /> */}
          {/* <MediaPlayer.PiP /> */}
          {/* <MediaPlayer.Fullscreen />
                </div> */}
          {/* </div>
            </MediaPlayer.Controls>
          </MediaPlayer.Root> */}
        </>
      ) : (
        <FilePreview url={url} fileInfo={fileInfo} />
      )}

      {isMoreMedia && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center hover:bg-black/60 transition-colors">
          <span className="text-white font-bold text-2xl">
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
}

interface FilePreviewProps {
  url: string;
  fileInfo: { type: MediaType; extension: string };
}

function FilePreview({ url, fileInfo }: FilePreviewProps) {
  const fileName = url.split("/").pop()?.split("?")[0] || "File";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 group-hover:from-blue-100 group-hover:to-indigo-200 transition-all duration-200">
      <div className="text-blue-600 mb-2 group-hover:scale-110 transition-transform duration-200">
        {getFileIconComponent(fileInfo.type)}
      </div>

      <span className="inline-block bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-2 uppercase">
        {fileInfo.extension}
      </span>

      <p className="text-xs text-gray-700 text-center px-2 line-clamp-2 group-hover:text-gray-900 font-medium mb-1">
        {fileName}
      </p>

      <p className="text-[10px] text-gray-500 group-hover:text-gray-700 font-medium">
        Click để xem
      </p>
    </div>
  );
}
