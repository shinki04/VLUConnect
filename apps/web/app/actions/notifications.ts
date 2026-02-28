"use server";

import { NotificationWithSender } from "@repo/shared/types/notification";
import { createClient } from "@repo/supabase/server";

export async function getActiveAnnouncements() {
    const supabase = await createClient();

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("system_announcements")
        .select("*")
        .eq("is_active", true)
        .lte("start_time", now)
        .or(`end_time.is.null,end_time.gte.${now}`)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching active announcements:", error);
        return [];
    }

    return data;
}

export async function getUserNotifications(
    limit: number = 10,
    offset: number = 0
): Promise<NotificationWithSender[]> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("notifications")
        .select(`
      *,
      sender:profiles!notifications_sender_id_fkey1(
        id,
        display_name,
        avatar_url
      )
    `)
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("Error fetching user notifications:", error);
        return [];
    }

    return data as NotificationWithSender[];
}

export async function markNotificationAsRead(notificationId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

    if (error) {
        console.error("Error marking notification as read:", error);
        return false;
    }

    return true;
}

export async function markAllNotificationsAsRead() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: user.id
    });

    if (error) {
        console.error("Error marking all notifications as read:", error);
        return false;
    }

    return true;
}
