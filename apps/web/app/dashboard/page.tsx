import { Button } from "@repo/ui/components/button";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import * as React from "react";

import Tepm from "@/components/dashboard/temp";
import AddPost from "@/components/posts/add";
import ListPosts from "@/components/posts/ListPosts";

import { getCurrentUser } from "../actions/user";
import { signOut } from "../auth/action";

// interface DashboardPageProps {
//   propName: type;
// }

export default async function DashboardPage() {
  const queryClient = new QueryClient();

  // const user = await queryClient.fetchQuery({
  //   queryKey: ["user"],
  //   queryFn: () => getCurrentUser(),
  //   staleTime: 10000,
  // });

  const [user] = await Promise.all([
    await queryClient.fetchQuery({
      queryKey: ["user"],
      queryFn: () => getCurrentUser(),
      staleTime: 10000,
    }),
  ]);
  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Button onClick={signOut}>Đăng xuất</Button>

        <Tepm />
        <Link href={`/profile/${user?.id}`}>
          <Button>My Profile</Button>
        </Link>
        <Link href={`/profile/716ce5a8-a82c-4bce-be69-723110b28c47`}>
          <Button>HieuTran Profile</Button>
        </Link>
        <Link href={`/profile/89780d45-e3da-4920-9a80-33af0266ffea`}>
          <Button>NhiNguyen Profile</Button>
        </Link>
        <Link href={`/profile/95a3fadb-5f4f-497f-b826-e9a66e8e4655`}>
          <Button>DucTrung Profile</Button>
        </Link>
        {/* <AddPost currentUser={user} /> */}
        <AddPost currentUser={user} />
        <ListPosts />
      </HydrationBoundary>
    </>
  );
}
