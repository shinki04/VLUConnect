import { getGroupPosts, getGroup } from "@/app/actions/group";
import { createClient } from "@repo/supabase/server";
import { Lock } from "lucide-react";
import { notFound } from "next/navigation";
import { GroupContent } from "@/components/groups/group-content";
import { PostResponse } from "@repo/shared/types/post";

interface GroupPageProps {
  params: Promise<{ slug: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { slug } = await params;
  const group = await getGroup(slug);

  if (!group) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check privacy and membership
  const isPrivate = group.privacy_level === "private";
  const isActiveMember = group.my_membership?.status === "active";
  const isAdmin = group.my_membership?.role === "admin";

  // Private group: show lock message if not a member
  if (isPrivate && !isActiveMember) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Group này là riêng tư</h2>
        <p className="text-muted-foreground mt-2">
          Tham gia group để xem bài viết và tham gia thảo luận.
        </p>
      </div>
    );
  }

  const { posts } = await getGroupPosts(group.id);

  return (
    <GroupContent
      group={group}
      initialPosts={posts as PostResponse[]}
      currentUser={user}
      isActiveMember={isActiveMember}
      isAdmin={isAdmin}
    />
  );
}
