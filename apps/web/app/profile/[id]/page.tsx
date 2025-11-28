import { getUserProfile } from "@/app/actions/user";
import Profile from "@/components/profile/Profile";
import { User } from "@/types/user";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import React from "react";

interface ProfileIdPageProps {
  params: Promise<{ id: string }>;
}

async function ProfileIdPage({ params }: ProfileIdPageProps) {
  const { id } = await params;
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
    queryKey: ["user", id],
    queryFn: () => getUserProfile(id),
    staleTime: 5 * 60 * 1000,
  });
  // await Promise.all([
  //   queryClient.fetchQuery({
  //     queryKey: ["user", id],
  //     queryFn: () => getUserProfile(id),
  //   }),
  // ]);
  const user = queryClient.getQueryData<User>(["user", id]);

  return (
    <>
      <div>ID : {id}</div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Profile user={user!} />
      </HydrationBoundary>
    </>
  );
}

export default ProfileIdPage;
