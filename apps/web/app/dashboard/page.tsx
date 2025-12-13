import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import * as React from "react";
import Image from "next/image";
import { Globe, Users, User, Image as ImageIcon, Link as LinkIcon, Send } from "lucide-react";
import ListPosts from "@/components/posts/ListPosts";
import { getCurrentUser } from "../actions/user";


export default async function DashboardPage() {
  const queryClient = new QueryClient();
  const [user] = await Promise.all([
    queryClient.fetchQuery({ queryKey: ["user"], queryFn: () => getCurrentUser() }),
  ]);

  const shortName = user?.display_name?.split(" ").pop() || "bạn";
  const initial = user?.display_name?.[0] || "U";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* TOP TABS */}
      <div className="flex items-center justify-center gap-8 mb-8">
        <button className="flex items-center gap-2 text-primary font-bold border-b-[3px] border-primary pb-2 px-1 transition-all">
          <span className="text-[17px]">Tất cả</span> <Globe className="w-5 h-5" />
        </button>
        <span className="text-gray-300 text-2xl font-light pb-2">|</span>
        <button className="flex items-center gap-2 text-muted-foreground font-bold hover:text-sidebar transition-colors pb-2 px-1 border-b-[3px] border-transparent">
          <span className="text-[17px]">Bạn bè</span> <User className="w-5 h-5" />
        </button>
        <span className="text-gray-300 text-2xl font-light pb-2">|</span>
        <button className="flex items-center gap-2 text-muted-foreground font-bold hover:text-sidebar transition-colors pb-2 px-1 border-b-[3px] border-transparent">
          <span className="text-[17px]">Nhóm</span> <Users className="w-5 h-5" />
        </button>
      </div>

      {/* CREATE POST TRIGGER - Visual only */}
      <div className="flex items-center gap-4 mb-8 px-0 w-full cursor-pointer group">
        <div className="h-12 w-12 rounded-full border-2 border-card shadow-sm overflow-hidden bg-card flex items-center justify-center shrink-0">
          {user?.avatar_url ? (
            <Image src={user.avatar_url} alt="User" width={48} height={48} className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-muted-foreground text-xl">{initial}</span>
          )}
        </div>
        <div className="flex-1 relative">
          <div className="w-full bg-card rounded-full h-[52px] flex items-center px-6 shadow-sm border border-input transition-all group-hover:border-primary/50 group-hover:shadow-md">
            <span className="text-muted-foreground text-[15px] select-none">
              Hi {shortName}, bạn đang nghĩ gì?
            </span>
          </div>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-5 text-muted-foreground pointer-events-none">
            <LinkIcon className="w-5 h-5 group-hover:text-sidebar transition-colors" />
            <ImageIcon className="w-5 h-5 group-hover:text-sidebar transition-colors" />
            <Send className="w-5 h-5 text-sidebar group-hover:text-primary transition-colors" />

          </div>
        </div>
      </div>

      {/* POSTS */}
      <div className="space-y-8">
        <ListPosts />
      </div>
    </HydrationBoundary>
  );
}
