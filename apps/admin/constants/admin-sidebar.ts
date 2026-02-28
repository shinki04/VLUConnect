import {
  Bell,
  FileText,
  Flag,
  Grid,
  Hash,
  Home,
  type LucideIcon,
  MessageSquare,
  Shield,
  Users,
} from "lucide-react";

// Route constants
export const ADMIN_ROUTES = {
  DASHBOARD: "/dashboard",
  // Users
  USERS: "/dashboard/users",
  USERS_MANAGE: "/dashboard/users/manage",
  // Posts
  POSTS: "/dashboard/posts",
  POSTS_ALL: "/dashboard/posts/all",
  POSTS_FLAGGED: "/dashboard/posts/flagged",
  POSTS_REJECTED: "/dashboard/posts/rejected",
  // Comments
  COMMENTS: "/dashboard/comments",
  COMMENTS_MANAGE: "/dashboard/comments/manage",
  // Reports
  REPORTS: "/dashboard/reports",
  REPORTS_MANAGE: "/dashboard/reports/manage",
  // Hashtags
  HASHTAGS: "/dashboard/hashtags",
  HASHTAGS_GROWTH: "/dashboard/hashtags/growth",
  HASHTAGS_MANAGE: "/dashboard/hashtags/manage",
  // Groups
  GROUPS: "/dashboard/groups",
  GROUPS_MANAGE: "/dashboard/groups/manage",
  // Moderation
  MODERATION: "/dashboard/moderation",
  MODERATION_ALL: "/dashboard/moderation/all",
  MODERATION_KEYWORDS: "/dashboard/moderation/keywords",
  // Notifications
  NOTIFICATIONS: "/dashboard/notifications",
} as const;

// Navigation item types
export interface NavSubItem {
  title: string;
  url: string;
}

export interface NavItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  items?: NavSubItem[];
}

// Sidebar navigation data
export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  {
    title: "Bảng điều khiển",
    url: ADMIN_ROUTES.DASHBOARD,
    icon: Home,
  },
  {
    title: "Quản lý người dùng",
    icon: Users,
    items: [
      { title: "Thống kê người dùng", url: ADMIN_ROUTES.USERS },
      { title: "Danh sách người dùng", url: ADMIN_ROUTES.USERS_MANAGE },
    ],
  },
  {
    title: "Quản lý nhóm",
    icon: Grid,
    items: [
      { title: "Thống kê nhóm", url: ADMIN_ROUTES.GROUPS },
      { title: "Danh sách nhóm", url: ADMIN_ROUTES.GROUPS_MANAGE },
    ],
  },
  {
    title: "Quản lý bài đăng",
    icon: FileText,
    items: [
      { title: "Thống kê bài đăng", url: ADMIN_ROUTES.POSTS },
      { title: "Tất cả bài đăng", url: ADMIN_ROUTES.POSTS_ALL },
      { title: "Bài viết bị đánh dấu Flag", url: ADMIN_ROUTES.POSTS_FLAGGED },
      { title: "Bài đăng bị từ chối", url: ADMIN_ROUTES.POSTS_REJECTED },
    ],
  },
  {
    title: "Quản lý bình luận",
    icon: MessageSquare,
    items: [
      { title: "Thống kê bình luận", url: ADMIN_ROUTES.COMMENTS },
      { title: "Danh sách bình luận", url: ADMIN_ROUTES.COMMENTS_MANAGE },
    ],
  },
  {
    title: "Quản lý yêu cầu tố cáo",
    icon: Flag,
    items: [
      { title: "Thống kê tố cáo", url: ADMIN_ROUTES.REPORTS },
      { title: "Xử lý yêu cầu tố cáo", url: ADMIN_ROUTES.REPORTS_MANAGE },
    ],
  },
  {
    title: "Quản lý kiểm duyệt",
    icon: Shield,
    items: [
      { title: "Thống kê kiểm duyệt", url: ADMIN_ROUTES.MODERATION },
      { title: "Các bài đã kiểm duyệt", url: ADMIN_ROUTES.MODERATION_ALL },
      { title: "Quản lý từ khóa", url: ADMIN_ROUTES.MODERATION_KEYWORDS },
    ],
  },
  {
    title: "Quản lý hashtags",
    icon: Hash,
    items: [
      { title: "Thống kê hashtag", url: ADMIN_ROUTES.HASHTAGS },
      {
        title: "Thống kê tăng trưởng",
        url: ADMIN_ROUTES.HASHTAGS_GROWTH,
      },
      { title: "Danh sách hashtag", url: ADMIN_ROUTES.HASHTAGS_MANAGE },
    ],
  },
  {
    title: "Quản lý thông báo",
    url: ADMIN_ROUTES.NOTIFICATIONS,
    icon: Bell,
  },
];

// App info
export const APP_INFO = {
  name: "Bảng Quản Trị",
  version: "1.0.0",
};
