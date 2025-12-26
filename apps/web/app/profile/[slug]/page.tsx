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
    <>
      <div>ID : {user?.id  }</div>
      <div>Slug : {user?.slug  }</div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Profile user={user!} />
        <div className="w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Bài viết</h2>
          <div className=" w-1/2 mx-auto">
            <InfinitePostsListByAuthor authorId={user!.id} />
          </div>
        </div>
      </HydrationBoundary>
    </>
  );
}

export default ProfileIdPage;
