import { Tables, Enums, TablesUpdate } from "./database.types";

export type privacyPost = Enums<"privacy_post">;
export type Post = Tables<"posts">;
export type UpdatePost = TablesUpdate<"posts">;
export type GlobalRole = Enums<"global_roles">;
export type PostAppeal = Tables<"post_appeals"> & {
  user: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  post: {
    content: string;
    author_id: string;
    media_urls?: string[] | null;
  } | null;
};

export type ManagementPost = Pick<Post, "id" | "content" | "created_at" | "privacy_level"> & {
  moderation_status: Post["moderation_status"] | "queue_pending" | "failed";
  post_appeals: {
    id: string;
    status: string;
    reason: string;
    created_at: string;
  }[];
  post_media?: {
    id: string;
    media_url: string;
    media_type: string;
  }[];
  is_queue_item?: boolean;
  queue_status?: string;
  error_message?: string | null;
  media_count?: number;
};

export type FeedFilter = "all" | "user" | "group";
export type ModerationStatus = Enums<"moderation_status">;
export type PostResponse = {
  id: string;
  created_at: string | null;
  author: {
    id: string;
    username: string | null;
    slug?: string;
    display_name: string | null;
    avatar_url: string | null;
    global_role: GlobalRole | null;
  };
  content: string;
  media_urls: string[] | null;
  updated_at: string | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  is_liked_by_viewer?: boolean;
  privacy_level: privacyPost;
  is_anonymous?: boolean | null; // Anonymous post flag
  group_id?: string | null;
  group?: {
    id: string;
    name: string;
    slug: string;
    allow_anonymous_comments?: boolean | null;
    allow_anonymous_posts?: boolean | null;
  } | null;
};

// Privacy configuration for UI display
export const PRIVACY_CONFIG = {
  public: {
    alt: "Công khai",
    icon: "Globe",
  },
  friends: {
    alt: "Bạn bè",
    icon: "Users",
  },
  private: {
    alt: "Riêng tư",
    icon: "LockKeyhole",
  },
} as const;
