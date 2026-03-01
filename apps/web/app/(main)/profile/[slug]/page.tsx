import { User } from "@repo/shared/types/user";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import React from "react";

import { getUserProfile } from "@/app/actions/user";
import InfinitePostsListByAuthor from "@/components/posts/InfinitePostsListByAuthor";
import Profile from "@/components/profile/Profile";

interface ProfileIdPageProps {
  params: Promise<{ slug: string }>;
}

async function ProfileIdPage({ params }: ProfileIdPageProps) {
  const { slug } = await params;
  const queryClient = new QueryClient();

  // const user = await queryClient.fetchQuery({
  //   queryKey: ["user", id],
  //   queryFn: () => getUserProfile(id),
  //   staleTime: 10000,
  // });

  // const CurrentDataUser: User = await queryClient.fetchQuery({
  //   queryKey: ["user"],
  //   queryFn: () => getCurrentUser(),
  //   initialData: queryClient.getQueryData(["user"]), // lấy từ cache
  // });

  // Prefetch data cho client-side
  await queryClient.fetchQuery({
    queryKey: ["user", slug],
    queryFn: () => getUserProfile(slug),
    staleTime: 5 * 60 * 1000,
  });
  // await Promise.all([
  //   queryClient.fetchQuery({
  //     queryKey: ["user", id],
  //     queryFn: () => getUserProfile(id),
  //   }),
  // ]);
  const user = queryClient.getQueryData<User>(["user", slug]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Profile user={user!}>
        <div className="bg-dashboard-card rounded-xl shadow-sm border border-dashboard-border overflow-hidden">
          <div className="px-4 py-3 bg-mainred/5 flex items-center gap-2 border-b border-mainred/10">
            <span className="material-symbols-outlined filled text-sm text-mainred">
              subject
            </span>
            <span className="text-[11px] font-bold text-mainred uppercase tracking-widest">
              Bài viết
            </span>
          </div>
          <div className="p-4 w-full">
            <InfinitePostsListByAuthor authorId={user!.id} />
          </div>
        </div>
      </Profile>
    </HydrationBoundary>
  );
}

export default ProfileIdPage;
