"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getUserNotifications } from "@/app/actions/notifications";

const ITEMS_PER_PAGE = 10;

export function useInfiniteNotifications() {
    return useInfiniteQuery({
        queryKey: ["notifications", "infinite"],
        queryFn: async ({ pageParam = 0 }) => {
            // We pass the current offset to the action (pageParam works as an offset here)
            const data = await getUserNotifications(ITEMS_PER_PAGE, pageParam);

            return {
                notifications: data || [],
                nextOffset: (data && data.length === ITEMS_PER_PAGE) ? pageParam + ITEMS_PER_PAGE : undefined,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset,
        initialPageParam: 0,
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: true, // We want notifications to update when they come back to the window
    });
}
