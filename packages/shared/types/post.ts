import { Tables, Enums } from "./database.types";

export type privacyPost = Enums<"privacy_post">;
export type Post = Tables<"posts">;
export type PostResponse = {
  id: string;
  created_at: string | null;
  author: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    global_role: "admin" | "moderator" | "student" | "lecturer" | null;
  };
  content: string;
  media_urls: string[] | null;
  updated_at: string | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  privacy_level: privacyPost;
};
