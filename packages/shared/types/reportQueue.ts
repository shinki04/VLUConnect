import { ReportType } from "./report";

export interface ReportJobPayload {
  reportId: string;
  reportedType: ReportType;
  reportedId: string;
  content: string; // The content to analyze (post content, comment content, message content)
  groupId?: string; // For group-scoped keyword checking
}
