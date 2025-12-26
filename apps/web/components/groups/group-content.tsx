"use client";

import { useState, useEffect } from "react";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import { PostResponse } from "@repo/shared/types/post";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/components/tabs";
import AddPost from "@/components/posts/add";
import PostCard from "@/components/posts/PostCard";
import PendingPost from "@/components/posts/PendingPost";
import { MemberList } from "@/components/groups/member-list";
import type { GroupWithDetails } from "@/app/actions/group";
import { GroupSettingsForm } from "@/components/groups/group-settings-form";
import { Calendar, Globe, Lock, Users, UserCheck, Loader2 } from "lucide-react";
import { formatPostDate } from "@repo/utils/formatDate";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { useInfiniteGroupPosts, groupKeys } from "@/hooks/useGroup";
import { createClient } from "@repo/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "@repo/shared/types/user";

interface GroupContentProps {
  group: GroupWithDetails;
  initialPosts: PostResponse[];
  currentUser: User
   
  isActiveMember: boolean;
  isAdmin: boolean;
}

export function GroupContent({
  group,
  initialPosts,
  currentUser,
  isActiveMember,
  isAdmin,
}: GroupContentProps) {
  const [activeTab, setActiveTab] = useState("discussion");
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [loadMoreRef, entry] = useIntersectionObserver({
    threshold: 0.1,
    root: null,
    rootMargin: "100px",
  });
  
  // Infinite Query for posts
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
  } = useInfiniteGroupPosts(group.id);

  // Flatten all pages into single array
  const posts = data?.pages.flatMap((page) => page.posts) as PostResponse[] ?? initialPosts;

  const myRole = group.my_membership?.role || null;

  // Auto fetch next page when loadMore element is visible
  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [entry, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Subscribe to post_queue realtime - khi có post mới hoàn thành thì refetch
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`group-posts-${group.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "post_queue_status",
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          // Khi queue item được đánh dấu completed, refetch group posts
          if (payload.new?.status === "completed") {
            console.log("Post completed, refetching group posts...");
            queryClient.invalidateQueries({ queryKey: groupKeys.posts(group.id) });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, group.id, queryClient, supabase]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      defaultValue="discussion"
    >
      <TabsList>
        <TabsTrigger value="discussion">Thảo luận</TabsTrigger>
        <TabsTrigger value="members">Thành viên</TabsTrigger>
        <TabsTrigger value="about">Giới thiệu</TabsTrigger>
        {isAdmin && <TabsTrigger value="settings">Cài đặt</TabsTrigger>}
      </TabsList>

      {/* Discussion Tab */}
      <TabsContent value="discussion">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {isActiveMember && currentUser && (
              <AddPost currentUser={currentUser} groupId={group.id} />
            )}

            {/* Pending posts - bài đang chờ xử lý */}
            <PendingPost groupId={group.id} />

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!
              </div>
            ) : (
              <>
                {isRefetching && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Đang cập nhật...</span>
                  </div>
                )}
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                
                {/* Load more trigger */}
                <div ref={loadMoreRef} className="py-4">
                  {isFetchingNextPage ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
                      <span className="text-sm text-muted-foreground">Đang tải thêm...</span>
                    </div>
                  ) : hasNextPage ? (
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => fetchNextPage()}
                    >
                      Tải thêm bài viết
                    </Button>
                  ) : posts.length > 0 ? (
                    <p className="text-center text-sm text-muted-foreground">
                      Đã hiển thị tất cả bài viết
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Giới thiệu</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {group.description || "Không có mô tả"}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* Members Tab */}
      <TabsContent value="members">
        <MemberList groupId={group.id} currentUserRole={myRole} />
      </TabsContent>

      {/* About Tab */}
      <TabsContent value="about">
        <Card>
          <CardHeader>
            <CardTitle>Về Group này</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.description && (
              <div>
                <h3 className="font-medium mb-2">Mô tả</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {group.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {group.privacy_level === "public" ? (
                  <Globe className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm">
                  {group.privacy_level === "public" ? "Công khai" : "Riêng tư"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {group.membership_mode === "auto" ? "Tham gia tự do" : "Cần duyệt"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {group.members_count || 0} thành viên
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Tạo {group.created_at ? formatPostDate(group.created_at) : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Settings Tab (Admin only) */}
      {isAdmin && (
        <TabsContent value="settings">
          <GroupSettingsForm group={group} />
        </TabsContent>
      )}
    </Tabs>
  );
}
