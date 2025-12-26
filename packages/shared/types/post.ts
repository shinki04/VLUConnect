import { Tables, Enums, TablesUpdate } from "./database.types";

export type privacyPost = Enums<"privacy_post">;
export type Post = Tables<"posts">;
export type UpdatePost = TablesUpdate<"posts">;
export type ModerationStatus = Enums<"moderation_status">;
export type PostResponse = {
  id: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    global_role: "admin" | "moderator" | "student" | "lecturer";
  };
  content: string;
  media_urls: string[] | null;
  updated_at: string | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  is_liked_by_viewer?: boolean;
  privacy_level: privacyPost;
  group_id?: string | null;
  group?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

