export type GroupPrivacyFilter = "all" | "public" | "private";

export interface ExploreGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  avatar_url: string | null;
  privacy_level: string;
  membership_mode: string;
  member_count: number;
  my_membership_status: "active" | "pending" | "none";
}
