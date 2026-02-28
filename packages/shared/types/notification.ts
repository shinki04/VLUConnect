import { Tables } from "./database.types";

export type NotificationType = Tables<"notifications">["type"];
export type NotificationEntityType = Tables<"notifications">["entity_type"];

export type NotificationWithSender = Tables<"notifications"> & {
    sender: {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
    } | null;
};

export const SYSTEM_ANNOUNCEMENT_TYPES = [
    { value: "info", label: "Thông tin (Info)" },
    { value: "warning", label: "Cảnh báo (Warning)" },
    { value: "success", label: "Thành công (Success)" },
    { value: "error", label: "Lỗi (Error)" },
    { value: "maintenance", label: "Bảo trì (Maintenance)" },
    { value: "event", label: "Sự kiện (Event)" },
] as const;

export type SystemAnnouncementType = typeof SYSTEM_ANNOUNCEMENT_TYPES[number]["value"] | (string & {});
