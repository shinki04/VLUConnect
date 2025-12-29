
import { Enums } from "./database.types";

export const ReportType = {
  POST: 'post',
  COMMENT: 'comment',
  USER: 'user',
  MESSAGE: 'message',
  GROUP: 'group',
} as const;

export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export type ReportStatus = Enums<"report_status">;

// export const ReportStatus = {
//   PENDING: 'pending',
//   REVIEWED: 'reviewed',
//   RESOLVED: 'resolved',
//   DISMISSED: 'dismissed',
// } as const;
export const REPORT_STATUS_UI: Record<
  ReportStatus,
  {
    label: string;
    color: 'default' | 'warning' | 'success' | 'danger';
  }
> = {
  pending: {
    label: 'Chờ xử lý',
    color: 'warning',
  },
  reviewed: {
    label: 'Đã xem',
    color: 'default',
  },
  resolved: {
    label: 'Đã giải quyết',
    color: 'success',
  },
  dismissed: {
    label: 'Đã bác bỏ',
    color: 'danger',
  },
};


export interface Report {
  id: string;
  reporter_id: string | null;
  reported_type: ReportType;
  reported_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportWithReporter extends Report {
  reporter?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const REPORT_TYPE_TABLE: Record<ReportType, string> = {
  post: 'posts',
  comment: 'comments',
  user: 'users',
  message: 'messages',
  group: 'groups',
};
