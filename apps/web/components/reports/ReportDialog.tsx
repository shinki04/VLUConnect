"use client";

import { ReportType } from "@repo/shared/types/report";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Textarea } from "@repo/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getReportedContent, submitReport } from "@/app/actions/report";

const REPORT_REASONS = [
  { value: "spam", label: "Spam hoặc lừa đảo" },
  { value: "harassment", label: "Quấy rối hoặc bắt nạt" },
  { value: "hate_speech", label: "Ngôn từ thù địch" },
  { value: "inappropriate", label: "Nội dung không phù hợp" },
  { value: "violence", label: "Bạo lực hoặc đe dọa" },
  { value: "other", label: "Lý do khác" },
] as const;

interface ReportDialogProps {
  type: ReportType;
  targetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReportDialog({
  type,
  targetId,
  open,
  onOpenChange,
  onSuccess,
}: ReportDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTypeLabel = () => {
    switch (type) {
      case "post":
        return "bài viết";
      case "comment":
        return "bình luận";
      case "message":
        return "tin nhắn";
      case "group":
        return "nhóm";
      case "user":
        return "người dùng";
      default:
        return "nội dung";
    }
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Vui lòng chọn lý do báo cáo");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get content for AI analysis (except groups)
      let content: string | undefined;
      let groupId: string | undefined;

      if (type !== "group") {
        const contentData = await getReportedContent(type, targetId);
        if (contentData) {
          content = contentData.content;
          groupId = contentData.groupId;
        }
      }

      await submitReport({
        reportedType: type,
        reportedId: targetId,
        reason,
        description: description || undefined,
        content,
        groupId,
      });

      toast.success("Báo cáo đã được gửi thành công");
      onOpenChange(false);
      setReason("");
      setDescription("");
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Có lỗi xảy ra khi gửi báo cáo"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Báo cáo {getTypeLabel()}</DialogTitle>
          <DialogDescription>
            Cho chúng tôi biết lý do bạn muốn báo cáo {getTypeLabel()} này.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <RadioGroup value={reason} onValueChange={setReason}>
            {REPORT_REASONS.map((r) => (
              <div key={r.value} className="flex items-center space-x-2">
                <RadioGroupItem value={r.value} id={r.value} />
                <Label htmlFor={r.value} className="cursor-pointer">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {reason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả chi tiết</Label>
              <Textarea
                id="description"
                placeholder="Vui lòng mô tả lý do báo cáo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi báo cáo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
