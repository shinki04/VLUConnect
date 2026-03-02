import { Enums, Tables } from "./database.types.js";

export type User = Tables<"profiles">;
export type Global_Roles = Enums<"global_roles">;

export const BLANK_AVATAR =
  "https://gizvqzsieazwdfncjxrg.supabase.co/storage/v1/object/public/avatars/base/blank-profile-picture-973460_640.webp";

export type Avatar = { name: string; fullPath: string };

export interface SearchedUser {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  global_role: Global_Roles;
  friendship_status: "friends" | "pending_sent" | "pending_received" | "blocked" | "none";
}
