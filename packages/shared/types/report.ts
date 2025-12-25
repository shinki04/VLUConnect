// Report types - flexible TypeScript types (not Supabase ENUM)

export const ReportType = {
  POST: 'post',
  COMMENT: 'comment',
  USER: 'user',
  MESSAGE: 'message',
} as const;

export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export const ReportStatus = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

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
