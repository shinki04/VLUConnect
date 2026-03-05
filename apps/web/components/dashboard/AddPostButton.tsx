"use client";

import type { User } from "@repo/shared/types/user";
import AlertDialog from "@repo/ui/components/AlertDialog";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { PlusIcon } from "lucide-react";
import React, { useState } from "react";

import AddPost from "@/components/posts/AddPost";

interface AddPostButtonProps {
  currentUser: User;
  groupId?: string;
  allowAnonymousPosts?: boolean;
  isMobileNav?: boolean;
}

export function AddPostButton({
  currentUser,
  groupId,
  allowAnonymousPosts,
  isMobileNav,
}: AddPostButtonProps) {
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClose = () => {
    setShowConfirm(true);
  };

  const handleConfirmClose = () => {
    setShowConfirm(false);
    setOpen(false);
  };

  return (
    <>
      {isMobileNav ? (
        <button
          onClick={() => setOpen(true)}
          className="h-14 w-14 rounded-full bg-mainred hover:bg-mainred-hover flex items-center justify-center text-white shadow-lg border-4 border-dashboard-sidebar transition-transform active:scale-95"
          aria-label="Thêm bài viết"
        >
          <PlusIcon className="h-6 w-6" strokeWidth={2.5} />
        </button>
      ) : (
        <Button
          className="w-full bg-mainred text-white transition-colors font-medium hover:bg-mainred-hover"
          onClick={() => setOpen(true)}
        >
          <PlusIcon className="text-white" />
          Thêm bài đăng mới
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) {
            handleClose();
          } else {
            setOpen(true);
          }
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[85vh] overflow-y-auto p-2 sm:p-4"
          onInteractOutside={(e) => {
            e.preventDefault();
            handleClose();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            handleClose();
          }}
        >
          <DialogHeader>
            <DialogTitle>Tạo bài viết mới</DialogTitle>
          </DialogHeader>
          <AddPost
            currentUser={currentUser}
            onCancel={handleClose}
            onSuccess={() => setOpen(false)}
            groupId={groupId}
            allowAnonymousPosts={allowAnonymousPosts}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Hủy bài viết?"
        description="Nội dung bạn đã nhập sẽ bị xóa. Bạn có chắc chắn muốn hủy không?"
        confirmText="Xác nhận"
        cancelText="Tiếp tục chỉnh sửa"
        onConfirm={handleConfirmClose}
      />
    </>
  );
}
