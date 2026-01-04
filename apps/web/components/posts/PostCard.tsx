"use client";

import { PostResponse } from "@repo/shared/types/post";
import AlertDialog from "@repo/ui/components/AlertDialog";
import { Card } from "@repo/ui/components/card";
import React from "react";
import { toast } from "sonner";

import { useGetCurrentUser } from "@/hooks/useAuth";
import { useDeletePost } from "@/hooks/usePost";
import { getFileInfo, isImageType, type MediaType } from "@/lib/mediaUtils";

import EditPost from "./EditPost";
import FileLightbox from "./FileLightbox";
import MediaGalleryModal from "./MediaGalleryModal";
import MediaLightbox from "./MediaLightbox";
import PostMediaGallery from "./MediaPreview";
import { PostActions } from "./PostActions";
import PostDetailDialog from "./PostDetailDialog";
import PostHeader from "./PostHeader";
import ReadMore from "./ReadMore";

interface PostCardProps {
  post: PostResponse;
  isPending?: boolean;
  allowAnonymousComments?: boolean;
}

export default function PostCard({ post, isPending = false, allowAnonymousComments = false }: PostCardProps) {
  const { mutate: mutateDelete } = useDeletePost();
  const currentUser = useGetCurrentUser();

  const [showGalleryModal, setShowGalleryModal] = React.useState(false);
  const [showDetailDialog, setShowDetailDialog] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [openAlert, setOpenAlert] = React.useState(false);
  const [openEditDialog, setOpenEditDialog] = React.useState(false);
  const [fileLightboxData, setFileLightboxData] = React.useState<{
    url: string;
    type: MediaType;
    name: string;
  } | null>(null);

  const isOwner = !isPending && post.author.id === currentUser.data?.id;

  const imageUrls = React.useMemo(
    () =>
      post.media_urls?.filter((url) => {
        const fileInfo = getFileInfo(url);
        return isImageType(fileInfo.type);
      }) || [],
    [post.media_urls]
  );

  const handleMediaClick = React.useCallback(
    (url: string, index: number, isMoreMedia: boolean) => {
      if (isMoreMedia) {
        setShowGalleryModal(true);
        return;
      }

      const fileInfo = getFileInfo(url);
      const isImage = isImageType(fileInfo.type);

      if (isImage && imageUrls.length > 0) {
        const imageIndex = imageUrls.indexOf(url);
        setLightboxIndex(imageIndex);
      } else if (!isImage && !fileInfo.type.includes("video")) {
        const fileName = url.split("/").pop()?.split("?")[0] || "File";
        setFileLightboxData({
          url,
          type: fileInfo.type,
          name: fileName,
        });
      }
    },
    [imageUrls]
  );

  const handleDelete = React.useCallback(() => {
    mutateDelete(post.id, {
      onSuccess: () => {
        toast.success("Xóa thành công", { id: post.id });
        setOpenAlert(false);
      },
      onError: () => {
        toast.error("Có lỗi", { id: post.id });
      },
    });
  }, [mutateDelete, post.id]);

  return (
    <>
      <Card
        className={`rounded-lg shadow hover:shadow-lg transition-shadow ${
          isPending ? "opacity-50 pointer-events-none relative" : ""
        }`}
      >
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 rounded-lg">
            <div className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium">Đang xử lý...</span>
            </div>
          </div>
        )}

        <div className="p-4">
          <PostHeader
            postId={post.id}
            author={post.author}
            createdAt={post.created_at!}
            updatedAt={post.updated_at}
            privacyLevel={post.privacy_level}
            isOwner={isOwner}
            onDelete={() => setOpenAlert(true)}
            onUpdate={() => setOpenEditDialog(true)}
            group={post.group}
            isAnonymous={post.is_anonymous ?? false}
            isGlobalAdmin={currentUser.data?.global_role === "admin"}
          />

          <div className="mb-3">
            <ReadMore content={post.content} />
          </div>
          <PostMediaGallery
            mediaUrls={post.media_urls || []}
            onMediaClick={handleMediaClick}
          />

          <PostActions
            post={{
                id: post.id,
                like_count: post.like_count || 0,
                comment_count: post.comment_count || 0,
                share_count: post.share_count || 0,
                is_liked_by_viewer: !!post.is_liked_by_viewer
            }}
            onCommentClick={() => setShowDetailDialog(true)}
            showStats={true}
          />
        </div>
      </Card>

      <PostDetailDialog 
        post={post}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        currentUser={currentUser.data}
        allowAnonymousComments={allowAnonymousComments}
        isGlobalAdmin={currentUser.data?.global_role === "admin"}
      />

      {showGalleryModal && (
        <MediaGalleryModal
          mediaUrls={post.media_urls || []}
          postContent={post.content}
          onClose={() => setShowGalleryModal(false)}
        />
      )}

      {lightboxIndex !== null &&
        imageUrls.length > 0 &&
        imageUrls[lightboxIndex] && (
          <MediaLightbox
            imageUrl={imageUrls[lightboxIndex]}
            allImageUrls={imageUrls}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}

      {fileLightboxData && (
        <FileLightbox
          fileUrl={fileLightboxData.url}
          fileType={fileLightboxData.type}
          fileName={fileLightboxData.name}
          onClose={() => setFileLightboxData(null)}
        />
      )}

      <EditPost
        open={openEditDialog}
        onOpenChange={setOpenEditDialog}
        post={post}
      />

      <AlertDialog
        open={openAlert}
        onOpenChange={setOpenAlert}
        title="Xóa bài đăng?"
        description="Bạn có chắc muốn xóa không? Hành động này không thể hoàn tác."
        onConfirm={handleDelete}
      />
    </>
  );
}
