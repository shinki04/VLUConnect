import {
  FileText,
  Flag,
  Hash,
  Home,
  MessageSquare,
  Shield,
  Users,
  Grid,
  type LucideIcon,
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
  HASHTAGS_MANAGE: "/dashboard/hashtags/manage",
  // Groups
  GROUPS: "/dashboard/groups",
  GROUPS_MANAGE: "/dashboard/groups/manage",
  // Access Control
  ACCESS_CONTROL: "/dashboard/access-control",
  ACCESS_CONTROL_ROLES: "/dashboard/access-control/roles",
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
    title: "Dashboard",
    url: ADMIN_ROUTES.DASHBOARD,
    icon: Home,
  },
  {
    title: "Users",
    icon: Users,
    items: [
      { title: "Analytics", url: ADMIN_ROUTES.USERS },
      { title: "Manage Users", url: ADMIN_ROUTES.USERS_MANAGE },
    ],
  },
  {
    title: "Groups",
    icon: Grid,
    items: [
      { title: "Manage Groups", url: ADMIN_ROUTES.GROUPS },
    ],
  },
  {
    title: "Posts",
    icon: FileText,
    items: [
      { title: "Analytics", url: ADMIN_ROUTES.POSTS },
      { title: "All Posts", url: ADMIN_ROUTES.POSTS_ALL },
      { title: "Flagged Posts", url: ADMIN_ROUTES.POSTS_FLAGGED },
      { title: "Rejected Posts", url: ADMIN_ROUTES.POSTS_REJECTED },
    ],
  },
  {
    title: "Comments",
    icon: MessageSquare,
    items: [
      { title: "Analytics", url: ADMIN_ROUTES.COMMENTS },
      { title: "Manage Comments", url: ADMIN_ROUTES.COMMENTS_MANAGE },
    ],
  },
  {
    title: "Reports",
    icon: Flag,
    items: [
      { title: "Analytics", url: ADMIN_ROUTES.REPORTS },
      { title: "Handle Reports", url: ADMIN_ROUTES.REPORTS_MANAGE },
    ],
  },
  {
    title: "Hashtags",
    icon: Hash,
    items: [
      { title: "Analytics", url: ADMIN_ROUTES.HASHTAGS },
      { title: "Manage Hashtags", url: ADMIN_ROUTES.HASHTAGS_MANAGE },
    ],
  },
  {
    title: "Access Control",
    icon: Shield,
    items: [
      { title: "Roles", url: ADMIN_ROUTES.ACCESS_CONTROL_ROLES },
    ],
  },
];

// App info
export const APP_INFO = {
  name: "Admin Panel",
  version: "1.0.0",
};
