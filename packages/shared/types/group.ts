import { Enums, Tables } from "./database.types";

export type Privacy_Group = Exclude<Enums<"privacy_group">, "secret">;
export type Membership_Mode = "auto" | "request";
export type GroupMemberStatus = Enums<"member_status">;
export type GroupMemberRole = Enums<"group_roles">;

export type GroupData = Tables<"groups">;

export type MemberProfile = Pick<
  Tables<"profiles">,
  "id" | "display_name" | "username" | "avatar_url" | "global_role" | "slug"
>;

export interface GroupMember extends Omit<Tables<"group_members">, "group_id"> {
  profile?: MemberProfile | null;
}

export interface GroupWithDetails extends GroupData {
  members_count: number;
  my_membership: GroupMember | null;
}
