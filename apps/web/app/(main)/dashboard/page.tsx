import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import * as React from "react";

import { getCurrentUser } from "@/app/actions/user";
import ListPosts from "@/components/posts/ListPosts";

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
  console.log("DashboardPage");
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
        {/* <Button onClick={signOut}>Đăng xuất</Button>
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
        <Link href={"/messages"}>
          <Button>Message</Button>
        </Link> */}
        {/* <AddPost currentUser={user} /> */}
        {/* <AddPost currentUser={user} /> */}
        {/* <PendingPost /> */}
        <ListPosts />
      </HydrationBoundary>
    </>
  );
}
