import * as React from "react";

import { Button } from "@/components/ui/button";
import { signOut } from "../auth/action";
import Tepm from "@/components/dashboard/temp";
import { getCurrentUser } from "../actions/user";
import Link from "next/link";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import AddPost from "@/components/dashboard/AddPost";
import ListPosts from "@/components/dashboard/ListPosts";

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
        <Link href={`/profile/4969daec-dad6-4008-9892-ab8eda0aab3e`}>
          <Button>NhiNguyen Profile</Button>
        </Link>
        <Link href={`/profile/95a3fadb-5f4f-497f-b826-e9a66e8e4655`}>
          <Button>DucTrung Profile</Button>
        </Link>
        <AddPost currentUser={user} />
        <ListPosts />
      </HydrationBoundary>
    </>
  );
}
