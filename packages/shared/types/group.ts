import { Enums } from "./database.types";

export type Privacy_Group = Exclude<Enums<"privacy_group">, "secret">;
export type Membership_Mode = "auto" | "request";
export type GroupMemberStatus = Enums<"member_status">;
export type GroupMemberRole = Enums<"group_roles">;
