"use client";

import React, { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Globe, Users, Lock, Download, FileText, ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Card } from "@repo/ui/components/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/dropdown-menu";
import { getFileInfo, isImageType } from "@/lib/mediaUtils";
import type { PostResponse } from "@repo/shared/types/post";
import ReadMore from "./ReadMore";

const formatCount = (count: number) => {
  if (!count) return "0";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

const getFileName = (url: string) => {
  try { return decodeURIComponent(url.split("/").pop()?.split("?")[0] || "File"); } catch { return "File đính kèm"; }
};

const getExtension = (filename: string) => { return filename.split(".").pop()?.toUpperCase() || "FILE"; };

const getPrivacyIcon = (level?: string) => {
  const iconProps = { className: "w-5 h-5 text-[#37426F]" }; // Icon Privacy màu xanh than
  switch (level) {
    case "friends": return <Users {...iconProps} />;
    case "private": return <Lock {...iconProps} />;
    default: return <Globe {...iconProps} />;
  }
};

const handleDownload = async (e: React.MouseEvent, url: string, fileName: string) => {
  e.stopPropagation(); e.preventDefault();
  try {
    const response = await fetch(url); const blob = await response.blob(); const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = blobUrl; link.download = fileName; document.body.appendChild(link); link.click();
    window.URL.revokeObjectURL(blobUrl); document.body.removeChild(link);
  } catch { window.open(url, "_blank"); }
};

const ImageSlider = ({ images }: { images: string[] }) => {
  const [current, setCurrent] = useState(0);
  const next = (e: any) => { e.stopPropagation(); setCurrent(c => (c === images.length - 1 ? 0 : c + 1)); };
  const prev = (e: any) => { e.stopPropagation(); setCurrent(c => (c === 0 ? images.length - 1 : c - 1)); };

  return (
    <div className="relative w-full aspect-[16/10] bg-gray-100 rounded-[20px] overflow-hidden group mt-3">
      <Image src={images[current]!} alt="media" fill className="object-cover transition-transform duration-500 hover:scale-105" />
      {images.length > 1 && <>
        <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 text-[#37426F]"><ChevronLeft className="w-5 h-5" /></button>
        <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 text-[#37426F]"><ChevronRight className="w-5 h-5" /></button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md">
          {images.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-white w-2.5" : "bg-white/50"}`} />)}
        </div>
      </>}
    </div>
  );
};

export default function PostCard({ post }: { post: PostResponse }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const mediaUrls = post.media_urls ?? [];
  const imageUrls = mediaUrls.filter(u => isImageType(getFileInfo(u).type));
  const attachmentUrls = mediaUrls.filter(u => !isImageType(getFileInfo(u).type));
  const createdAt = post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi }) : "";

  return (
    <Card className="bg-white rounded-[24px] shadow-sm border border-transparent overflow-hidden mb-6 p-0">
      {/* 1. HEADER */}
      <div className="p-5 pb-2 flex justify-between items-center">
        <div className="flex gap-3.5 items-center">
          <Avatar className="w-11 h-11 border border-gray-100 cursor-pointer"><AvatarImage src={post.author?.avatar_url || ""} /><AvatarFallback className="text-[#37426F] bg-[#E0E7FF] font-bold">U</AvatarFallback></Avatar>
          <div className="flex flex-col">
            <h3 className="font-bold text-[#37426F] text-[16px] cursor-pointer hover:underline">{post.author?.display_name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div title="Quyền riêng tư">{getPrivacyIcon(post.privacy_level)}</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button className="text-[#37426F] hover:bg-[#EEF2FF] p-2 rounded-full transition-colors -mr-2 outline-none"><MoreVertical className="w-5 h-5" /></button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-white border border-gray-100 rounded-xl shadow-lg p-1.5 z-50">
              <DropdownMenuItem onClick={(e) => console.log("Edit")} className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-[#EEF2FF] text-[#37426F] cursor-pointer"><Edit className="w-4 h-4" /><span className="font-medium text-[13px]">Sửa bài viết</span></DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => console.log("Delete")} className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-red-50 text-[#EF4444] cursor-pointer"><Trash2 className="w-4 h-4" /><span className="font-medium text-[13px]">Xóa bài viết</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2. MEDIA */}
      {imageUrls.length > 0 && <div className="px-5 pb-2"><ImageSlider images={imageUrls} /></div>}

      {/* 3. CONTENT */}
      <div className="px-5 pb-1 font-medium text-[15px] text-[#1f2937] leading-relaxed"><ReadMore content={post.content} /></div>

      {/* 4. FILES */}
      {attachmentUrls.length > 0 && <div className="px-5 mt-2 space-y-2">
        {attachmentUrls.map((url, i) => (
          <div key={i} onClick={() => window.open(url, "_blank")} className="flex items-center justify-between bg-[#E0E7FF] rounded-2xl p-3.5 cursor-pointer hover:bg-[#d0d7ff] transition-colors group relative">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-white p-2 rounded-xl shadow-sm"><FileText className="w-8 h-8 text-[#37426F]" strokeWidth={1.2} /></div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-bold text-[#37426F] truncate">{getFileName(url)}</span>
                <div className="flex items-center gap-2 text-[11px] text-[#37426F]/70 font-medium"><span>{getExtension(getFileName(url))}</span><span>•</span><span>1.2 MB</span></div>
              </div>
            </div>
            <button onClick={(e) => handleDownload(e, url, getFileName(url))} className="p-2 hover:bg-white/60 rounded-full text-[#37426F] z-10"><Download className="w-5 h-5" strokeWidth={2} /></button>
          </div>
        ))}
      </div>}

      {/* 5. ACTIONS */}
      <div className="px-5 py-3 flex items-center justify-between mt-1">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setIsLiked(!isLiked); setLikesCount(p => isLiked ? p - 1 : p + 1) }}>
            <Heart className={`w-6 h-6 transition-colors ${isLiked ? "fill-[#EF4444] text-[#EF4444]" : "text-[#37426F] group-hover:text-[#EF4444]"}`} strokeWidth={1.5} />
            <span className={`text-[15px] font-bold ${isLiked ? "text-[#EF4444]" : "text-[#37426F]"}`}>{formatCount(likesCount)}</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer group"><MessageCircle className="w-6 h-6 text-[#37426F] group-hover:text-blue-500" strokeWidth={1.5} /><span className="text-[15px] font-bold text-[#37426F]">{formatCount(post.comments_count || 0)}</span></div>
          <div className="flex items-center gap-2 cursor-pointer group"><Share2 className="w-6 h-6 text-[#37426F] group-hover:text-blue-500" strokeWidth={1.5} /><span className="text-[15px] font-bold text-[#37426F]">{formatCount(post.shares_count || 0)}</span></div>
        </div>
        <button className="p-1.5 hover:bg-yellow-50 rounded-full group"><Bookmark className="w-6 h-6 text-[#37426F] group-hover:text-yellow-500" strokeWidth={1.5} /></button>
      </div>

      {/* 6. TIME */}
      <div className="px-5 pb-4 text-[11px] text-gray-400 font-medium uppercase tracking-wide">{createdAt}</div>
    </Card>
  );
}