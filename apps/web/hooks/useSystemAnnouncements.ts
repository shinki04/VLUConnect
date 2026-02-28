import { useQuery } from "@tanstack/react-query";

import { getActiveAnnouncements } from "@/app/actions/notifications";

export function useSystemAnnouncements() {
    return useQuery({
        queryKey: ["system_announcements", "active"],
        queryFn: async () => {
            const data = await getActiveAnnouncements();
            return data || [];
        },
    });
}
