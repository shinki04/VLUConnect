"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { Flag } from "lucide-react";
import * as React from "react";

const FLAG_REASONS = [
  { value: "community", label: "Vi phạm tiêu chuẩn cộng đồng" },
  { value: "harassment", label: "Bài viết công kích cá nhân" },
  { value: "fake", label: "Giả mạo" },
  { value: "scam", label: "Lừa đảo" },
  { value: "other", label: "Khác (nhập lý do)" },
] as const;

interface FlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

export function FlagDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: FlagDialogProps) {
  const [selectedReason, setSelectedReason] = React.useState<string>("");
  const [customReason, setCustomReason] = React.useState("");

  const handleConfirm = () => {
    const reason = selectedReason === "other" 
      ? customReason.trim() 
      : FLAG_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
    if (reason) {
      onConfirm(reason);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedReason("");
      setCustomReason("");
    }
    onOpenChange(open);
  };

  const isValid = selectedReason && (selectedReason !== "other" || customReason.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-orange-500" />
            Flag Post
          </DialogTitle>
          <DialogDescription>
            Chọn lý do đánh dấu bài viết này để xem xét.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Lý do</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn lý do..." />
              </SelectTrigger>
              <SelectContent>
                {FLAG_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Lý do khác</Label>
              <Textarea
                id="customReason"
                placeholder="Nhập lý do cụ thể..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button 
            variant="default" 
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {loading && (
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            )}
            Đánh dấu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
