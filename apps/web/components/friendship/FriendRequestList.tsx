"use client";

import { BLANK_AVATAR } from "@repo/shared/types/user";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Loader2, UserCheck, UserX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { usePendingRequests } from "@/hooks/useFriendship";

interface FriendRequestListProps {
  className?: string;
}

export function FriendRequestList({ className }: FriendRequestListProps) {
  const { requests, isLoading, accept, reject, isResponding } =
    usePendingRequests();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Lời mời kết bạn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Lời mời kết bạn</CardTitle>
          <CardDescription>Không có lời mời nào</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Lời mời kết bạn</CardTitle>
        <CardDescription>{requests.length} lời mời đang chờ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between gap-3 rounded-lg border p-3"
          >
            <Link
              href={`/profile/${request.requester_id}`}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <Image
                src={request.requester?.avatar_url || BLANK_AVATAR}
                alt={request.requester?.display_name || "User"}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {request.requester?.display_name || "Người dùng"}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  @{request.requester?.username}
                </p>
              </div>
            </Link>

            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => {
                  accept(request.id);
                  toast.success("Đã chấp nhận lời mời");
                }}
                disabled={isResponding}
              >
                {isResponding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  reject(request.id);
                  toast.info("Đã từ chối lời mời");
                }}
                disabled={isResponding}
              >
                <UserX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default FriendRequestList;
