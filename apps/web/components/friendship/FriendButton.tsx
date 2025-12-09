/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useEffect, useState } from "react";
import { Loader2, UserCheck, UserMinus, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";

import { useFriendship } from "@/hooks/useFriendship";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";

interface FriendButtonProps {
  targetUserId: string;
  currentUserId: string;
  className?: string;
}

type TransitionState = {
  pending: boolean;
  canceling: boolean;
  accepting: boolean;
  rejecting: boolean;
  unfriending: boolean;
};

export function FriendButton({
  targetUserId,
  currentUserId,
  className,
}: FriendButtonProps) {
  const {
    status,
    direction,
    friendship,
    isLoading,
    sendRequest,
    isSending,
    acceptRequest,
    rejectRequest,
    isResponding,
    cancelRequest,
    isCanceling,
    unfriend,
    isUnfriending,
  } = useFriendship(targetUserId);

  const [transitions, setTransitions] = useState<TransitionState>({
    pending: false,
    canceling: false,
    accepting: false,
    rejecting: false,
    unfriending: false,
  });

  // Reset pending transition when request is sent
   
  useEffect(() => {
    if (!transitions.pending) return;
    if (status === "pending" && direction === "sent") {
      setTransitions((prev) => ({ ...prev, pending: false }));
    }
  }, [status, direction, transitions.pending]);

  // Reset canceling transition when request is canceled
   
  useEffect(() => {
    if (!transitions.canceling) return;
    if (status === null) {
      setTransitions((prev) => ({ ...prev, canceling: false }));
    }
  }, [status, transitions.canceling]);

  // Reset accepting transition when request is accepted
   
  useEffect(() => {
    if (!transitions.accepting) return;
    if (status === "friends") {
      setTransitions((prev) => ({ ...prev, accepting: false }));
    }
  }, [status, transitions.accepting]);

  // Reset rejecting transition when request is rejected
   
  useEffect(() => {
    if (!transitions.rejecting) return;
    if (status === null) {
      setTransitions((prev) => ({ ...prev, rejecting: false }));
    }
  }, [status, transitions.rejecting]);

  // Reset unfriending transition when unfriend is complete
   
  useEffect(() => {
    if (!transitions.unfriending) return;
    if (status === null) {
      setTransitions((prev) => ({ ...prev, unfriending: false }));
    }
  }, [status, transitions.unfriending]);

  // Combined loading states
  const isAddingFriend = isSending || transitions.pending;
  const isCancelingFriend = isCanceling || transitions.canceling;
  const isAcceptingFriend = isResponding || transitions.accepting;
  const isRejectingFriend = isResponding || transitions.rejecting;
  const isRemovingFriend = isUnfriending || transitions.unfriending;

  const handleSendRequest = () => {
    setTransitions((prev) => ({ ...prev, pending: true }));
    sendRequest();
    toast.success("Đã gửi lời mời kết bạn");
  };

  const handleCancelRequest = () => {
    if (!friendship) return;
    setTransitions((prev) => ({ ...prev, canceling: true }));
    cancelRequest(friendship.id);
    toast.success("Đã hủy lời mời kết bạn");
  };

  const handleAcceptRequest = () => {
    if (!friendship) return;
    setTransitions((prev) => ({ ...prev, accepting: true }));
    acceptRequest(friendship.id);
    toast.success("Đã chấp nhận lời mời kết bạn");
  };

  const handleRejectRequest = () => {
    if (!friendship) return;
    setTransitions((prev) => ({ ...prev, rejecting: true }));
    rejectRequest(friendship.id);
    toast.info("Đã từ chối lời mời kết bạn");
  };

  const handleUnfriend = () => {
    setTransitions((prev) => ({ ...prev, unfriending: true }));
    unfriend();
    toast.success("Đã hủy kết bạn");
  };

  // Don't show button for own profile
  if (targetUserId === currentUserId) return null;

  // Loading state
  if (isLoading) {
    return (
      <Button variant="outline" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // Already friends
  if (status === "friends") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={className}
            disabled={isRemovingFriend}
          >
            {isRemovingFriend ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="mr-2 h-4 w-4" />
            )}
            {isRemovingFriend ? "Đang hủy..." : "Bạn bè"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleUnfriend}
            disabled={isRemovingFriend}
            className="text-destructive focus:text-destructive"
          >
            <UserMinus className="mr-2 h-4 w-4" />
            {isRemovingFriend ? "Đang hủy..." : "Hủy kết bạn"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Pending request sent by current user
  if (status === "pending" && direction === "sent") {
    return (
      <Button
        variant="secondary"
        className={className}
        onClick={handleCancelRequest}
        disabled={isCancelingFriend}
      >
        {isCancelingFriend ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UserX className="mr-2 h-4 w-4" />
        )}
        {isCancelingFriend ? "Đang hủy..." : "Hủy lời mời"}
      </Button>
    );
  }

  // Pending request received from target user
  if (status === "pending" && direction === "received") {
    return (
      <div className="flex gap-2">
        <Button
          variant="default"
          onClick={handleAcceptRequest}
          disabled={isAcceptingFriend || isRejectingFriend}
          className={className}
        >
          {isAcceptingFriend ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserCheck className="mr-2 h-4 w-4" />
          )}
          {isAcceptingFriend ? "Đang xử lý..." : "Chấp nhận"}
        </Button>
        <Button
          variant="outline"
          onClick={handleRejectRequest}
          disabled={isAcceptingFriend || isRejectingFriend}
        >
          {isRejectingFriend ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserX className="mr-2 h-4 w-4" />
          )}
          {isRejectingFriend ? "Đang xử lý..." : "Từ chối"}
        </Button>
      </div>
    );
  }

  // Blocked - don't show button
  if (status === "blocked") return null;

  // No relationship - show add friend button
  return (
    <Button
      onClick={handleSendRequest}
      disabled={isAddingFriend}
      className={className}
    >
      {isAddingFriend ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="mr-2 h-4 w-4" />
      )}
      {isAddingFriend ? "Đang gửi..." : "Kết bạn"}
    </Button>
  );
}

export default FriendButton;
