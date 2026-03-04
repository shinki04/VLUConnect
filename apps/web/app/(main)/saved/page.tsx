"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Bookmark } from "lucide-react";

import { InfiniteSavedPostsList } from "@/components/posts/InfiniteSavedPostsList";

export default function SavedPostsPage() {
  return (
    <div className="flex flex-col w-full mx-auto pt-4 md:py-8 px-0 md:px-4">
      <Card className="flex flex-col w-full border-none shadow-none md:border-solid bg-transparent md:bg-dashboard-card dark:md:bg-dashboard-darkCard">
        <CardHeader className="flex flex-row items-center gap-3 p-4 md:px-8 border-b border-dashboard-border space-y-0">
          <div className="bg-mainred/10 p-2.5 rounded-xl shrink-0">
            <Bookmark className="w-6 h-6 text-mainred" />
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Bài viết đã lưu
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Danh sách các bài viết bạn đã yêu thích
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-4 md:pt-6 px-4 md:px-8 pb-8">
          <InfiniteSavedPostsList />
        </CardContent>
      </Card>
    </div>
  );
}
