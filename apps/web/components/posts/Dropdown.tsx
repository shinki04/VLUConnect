import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Separator } from "@repo/ui/components/separator";
import { Flag, MoreHorizontalIcon, Pencil, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { ReportDialog } from "@/components/reports/ReportDialog";

interface PostOwnerDropdownProps {
  onDelete: () => void;
  onUpdate: () => void;
}

export function PostOwnerDropdown({
  onDelete,
  onUpdate,
}: PostOwnerDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="More Options">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onUpdate}>
            <Pencil />
            Cập nhật
          </DropdownMenuItem>
          {/* <DropdownMenuItem>Archive</DropdownMenuItem> */}
        </DropdownMenuGroup>
        {/* <DropdownMenuSeparator /> */}
        {/* <DropdownMenuGroup>
          <DropdownMenuItem>Snooze</DropdownMenuItem>
          <DropdownMenuItem>Add to Calendar</DropdownMenuItem>
          <DropdownMenuItem>Add to List</DropdownMenuItem>
        </DropdownMenuGroup> */}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2Icon />
            Xóa bài viết
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface PostViewerDropdownProps {
  postId: string;
  canDelete?: boolean;
  onDelete?: () => void;
}

export function PostViewerDropdown({
  postId,
  canDelete,
  onDelete,
}: PostViewerDropdownProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More Options">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowReportDialog(true)}
            >
              <Flag className="mr-2 h-4 w-4" />
              Báo cáo
            </DropdownMenuItem>
            {canDelete && onDelete && (
              <>
                <Separator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2Icon className="mr-2 h-4 w-4" />
                  Xóa bài viết
                </DropdownMenuItem>
              </>
            )}
            {/* <DropdownMenuItem>Archive</DropdownMenuItem> */}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        type="post"
        targetId={postId}
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
      />
    </>
  );
}
