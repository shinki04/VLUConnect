"use client";

import { GroupMemberRole } from "@repo/shared/types/group";
import { PostResponse } from "@repo/shared/types/post";

import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Tabs, TabsContent,TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { formatPostDate } from "@repo/utils/formatDate";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import { Calendar, Crown, Globe, Loader2,Lock, Shield, ShieldCheck, User as UserIcon, Users } from "lucide-react";

import { useEffect,useState } from "react";

import type { GroupMember, GroupWithDetails } from "@/app/actions/group";
import { BlockedKeywordsForm } from "@/components/groups/blocked-keywords-form";
import { GroupSettingsForm } from "@/components/groups/group-settings-form";
import { MemberList } from "@/components/groups/member-list";
import PostCard from "@/components/posts/PostCard";
import { UserCard } from "@/components/user-card";
import { useGetCurrentUser } from "@/hooks/useAuth";
import { useInfiniteGroupPosts } from "@/hooks/useGroup";
import { canManageGroup } from "@/lib/utils/group-permissions";

import { AddPostButton } from "../dashboard/AddPostButton";

interface GroupContentProps {
  group: GroupWithDetails;
  initialPosts: PostResponse[];
  coreMembers: GroupMember[];
  friendMembers: GroupMember[];
  isActiveMember: boolean;
  isAdmin: boolean;
}

const ROLE_LABELS: Record<GroupMemberRole, string> = {
  admin: "Admin",
  sub_admin: "Phó Admin",
  moderator: "Điều hành",
  member: "Thành viên",
};

const ROLE_ICONS: Record<GroupMemberRole, React.ReactNode> = {
  admin: <Crown className="w-3 h-3" />,
  sub_admin: <ShieldCheck className="w-3 h-3" />,
  moderator: <Shield className="w-3 h-3" />,
  member: <UserIcon className="w-3 h-3" />,
};

const ROLE_COLORS: Record<GroupMemberRole, string> = {
  admin: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  sub_admin: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  moderator: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  member: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

export function GroupContent({
  group,
  initialPosts,
  coreMembers,
  friendMembers,
  isActiveMember,
  isAdmin,
}: GroupContentProps) {
  // Get currentUser from TanStack Query (already cached with staleTime: Infinity)
  const { data: currentUser } = useGetCurrentUser();
  // Determine if user can see posts
  // Logic: Public Group OR Active Member
  const canViewPosts = group.privacy_level === "public" || isActiveMember;

  const [activeTab, setActiveTab] = useState(
    canViewPosts ? "discussion" : "overview",
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const [loadMoreRef, entry] = useIntersectionObserver({
    threshold: 0.1,
    root: null,
    rootMargin: "100px",
  });

  // Infinite Query for posts (Only enabled if canViewPosts)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteGroupPosts(group.id); // Hook internally enabled/disabled logic? No, let's just use it, RLS blocks if needed.
  // Actually hook is always enabled in previous code.

  // Flatten all pages into single array
  const posts =
    (data?.pages.flatMap((page) => page.posts) as PostResponse[]) ??
    initialPosts;

  const myRole = group.my_membership?.role || null;

  // Auto fetch next page when loadMore element is visible
  useEffect(() => {
    if (
      entry?.isIntersecting &&
      hasNextPage &&
      !isFetchingNextPage &&
      canViewPosts
    ) {
      fetchNextPage();
    }
  }, [entry, hasNextPage, isFetchingNextPage, fetchNextPage, canViewPosts]);

  const renderMemberItem = (member: GroupMember) => (
    <UserCard
      key={member.user_id}
      user={{
        id: member.profile?.id || member.user_id,
        slug: member.profile?.slug,
        displayName: member.profile?.display_name,
        username: member.profile?.username,
        avatarUrl: member.profile?.avatar_url,
      }}
      subtitle={`@${member.profile?.display_name || member.profile?.slug}`}
      rightAction={
        <Badge
          variant="outline"
          className={`${ROLE_COLORS[member.role]} flex items-center gap-1 wrap-break-word`}
        >
          {ROLE_ICONS[member.role]}
          <span className="hidden sm:inline">{ROLE_LABELS[member.role]}</span>
        </Badge>
      }
    />
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      defaultValue={canViewPosts ? "discussion" : "overview"}
    >
      <TabsList
        variant="line"
        className="w-full overflow-x-auto overflow-y-hidden justify-start flex-nowrap scrollbar-none"
      >
        {canViewPosts && (
          <TabsTrigger value="discussion">Thảo luận</TabsTrigger>
        )}
        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
        <TabsTrigger value="members">Tất cả thành viên</TabsTrigger>
        <TabsTrigger value="about">Giới thiệu</TabsTrigger>
        {canManageGroup(myRole) && (
          <TabsTrigger value="manage">Quản lý</TabsTrigger>
        )}
      </TabsList>

      {/* Discussion Tab (Only if allowed) */}
      {canViewPosts && (
        <TabsContent value="discussion">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3 mt-2 md:mt-5 ">
              {mounted && isActiveMember && currentUser && (
                <AddPostButton
                  currentUser={currentUser}
                  groupId={group.id}
                  allowAnonymousPosts={group.allow_anonymous_posts ?? false}
                />
              )}

              {/* Pending posts */}
              {/* <PendingPost groupId={group.id} /> */}

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
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      allowAnonymousComments={
                        group.allow_anonymous_comments ?? false
                      }
                    />
                  ))}

                  {/* Load more trigger */}
                  <div ref={loadMoreRef} className="py-4">
                    {isFetchingNextPage && (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">
                          Đang tải thêm...
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Sidebar - hidden on mobile */}
            <div className="hidden lg:block space-y-4 mt-2">
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
      )}

      {/* Overview Tab */}
      <TabsContent value="overview">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Core Members Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Ban quản trị
                </CardTitle>
              </CardHeader>
              <CardContent>
                {coreMembers.length > 0 ? (
                  <div className="flex flex-col">
                    {coreMembers.map(renderMemberItem)}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Chưa có thông tin ban quản trị
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Friends Section */}
            {mounted && currentUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Bạn bè trong nhóm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {friendMembers.length > 0 ? (
                    <div className="flex flex-col">
                      {friendMembers.map(renderMemberItem)}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Không có bạn bè nào trong nhóm này.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Thông tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {group.privacy_level === "public" ? (
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">
                    {group.privacy_level === "public"
                      ? "Công khai"
                      : "Riêng tư"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {group.members_count || 0} thành viên
                  </span>
                </div>
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
                <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                  {group.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {group.privacy_level === "public" ? "Công khai" : "Riêng tư"}
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
                  Tạo{" "}
                  {group.created_at ? formatPostDate(group.created_at) : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Manage Tab (Admin/Sub-admin/Moderator only) */}
      {canManageGroup(myRole) && (
        <TabsContent value="manage">
          <div className="space-y-6">
            {/* Member Moderation */}
            <Card>
              <CardHeader>
                <CardTitle>Kiểm duyệt thành viên</CardTitle>
              </CardHeader>
              <CardContent>
                <MemberList groupId={group.id} currentUserRole={myRole} />
              </CardContent>
            </Card>

            {/* Blocked Keywords */}
            <Card>
              <CardHeader>
                <CardTitle>Quản lý từ cấm</CardTitle>
              </CardHeader>
              <CardContent>
                <BlockedKeywordsForm groupId={group.id} canManage={true} />
              </CardContent>
            </Card>

            {/* Settings (Admin only) */}
            {isAdmin && (
              <div className="w-full">
                <GroupSettingsForm group={group} />
              </div>
            )}
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}

