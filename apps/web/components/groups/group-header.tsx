"use client";

import AlertDialog from "@repo/ui/components/AlertDialog";
import { Button } from "@repo/ui/components/button";
import { Globe, Lock,Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { GroupWithDetails } from "@/app/actions/group";
import { joinGroup, leaveGroup } from "@/app/actions/group";

interface GroupHeaderProps {
  group: GroupWithDetails;
  currentUser: { id: string; email?: string } | null;
}

export function GroupHeader({ group, currentUser }: GroupHeaderProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Simple membership check from clean data structure
  const myMembership = group.my_membership;
  const isJoined = myMembership !== null;
  const isActiveMember = myMembership?.status === "active";
  const isPendingRequest = myMembership?.status === "pending";
  const isAdmin = myMembership?.role === "admin";

  const handleJoin = () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    startTransition(async () => {
      try {
        const res = await joinGroup(group.id);
        if (res?.error) {
          toast.error(res.error);
        } else if (res?.status === "pending") {
          toast.success("Yêu cầu đã được gửi!");
        } else {
          toast.success("Đã tham gia group!");
          router.refresh();
        }
      } catch (e) {
        toast.error("Không thể tham gia group");
      }
    });
  };


  const handleLeave = () => {
    if (isAdmin) {
      toast.error("Admin không thể rời group. Hãy chuyển quyền admin trước.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await leaveGroup(group.id);
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success("Đã rời khỏi group");
          router.refresh();
        }
      } catch (e) {
        toast.error("Không thể rời group");
      }
      setOpen(false);
    });
  };

  return (
   <>
    <div className="bg-card border-b mb-6">
      {/* Cover Image */}
      <div className="h-48 md:h-72 bg-muted relative w-full overflow-hidden">
        {group.cover_url ? (
          <img
            src={group.cover_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/30" />
        )}
      </div>

      {/* Group Info */}
      <div className="container max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-6 relative z-10 ">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-xl border-4 border-background bg-muted overflow-hidden shrink-0">
            {group.avatar_url ? (
              <img
                src={group.avatar_url}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <Users className="w-10 h-10 text-primary/60" />
              </div>
            )}
          </div>

          {/* Name and Meta */}
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 w-full">
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  {group.privacy_level === "public" ? (
                    <>
                      <Globe className="w-4 h-4" /> Công khai
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Riêng tư
                    </>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {group.members_count} thành viên
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isPendingRequest ? (
                <Button variant="outline" disabled>
                  Đang chờ duyệt
                </Button>
              ) : isActiveMember ? (
                <Button variant="outline" onClick={() => setOpen(true)} disabled={isPending}>
                  {isPending ? "Đang xử lý..." : "Rời Group"}
                </Button>
              ) : (
                <Button onClick={handleJoin} disabled={isPending}>
                  {isPending ? "Đang xử lý..." : "Tham gia Group"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    <AlertDialog open={open} onOpenChange={setOpen} title="Rời Group" description="Bạn có chắc chắn muốn rời khỏi group này?" onConfirm={handleLeave}/>
   </>
  );
}
