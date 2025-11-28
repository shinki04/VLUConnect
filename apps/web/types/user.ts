import { Enums, Tables } from "@/types/database.types";

export type User = Tables<"profiles">;
export type Global_Roles = Enums<"global_roles">;

export const BLANK_AVATAR =
  "https://gizvqzsieazwdfncjxrg.supabase.co/storage/v1/object/public/avatars/base/blank-profile-picture-973460_640.webp";

export type Avatar = { name: string; fullPath: string };
