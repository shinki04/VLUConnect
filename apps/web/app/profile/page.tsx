import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import React from "react";

import { getCurrentUser } from "../actions/user";

async function ProfilePage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["user"],
    queryFn: () => getCurrentUser(),
    staleTime: 10000,
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* <Profile /> */}
    </HydrationBoundary>
  );
}

export default ProfilePage;
