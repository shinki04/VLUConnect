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
