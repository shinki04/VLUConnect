"use client";

import { BLANK_AVATAR } from "@repo/shared/types/user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useFriends } from "@/hooks/useFriendship";

interface FriendsListProps {
  userId: string;
  className?: string;
  limit?: number;
  showViewAll?: boolean;
}

export function FriendsList({
  userId,
  className,
  limit = 6,
  showViewAll = true,
}: FriendsListProps) {
  const { data: friends, isLoading, error } = useFriends(userId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bạn bè
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bạn bè
          </CardTitle>
          <CardDescription className="text-destructive">
            Lỗi khi tải danh sách bạn bè
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const displayedFriends = friends?.slice(0, limit) || [];
  const totalFriends = friends?.length || 0;

  if (totalFriends === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bạn bè
          </CardTitle>
          <CardDescription>Chưa có bạn bè</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bạn bè
        </CardTitle>
        <CardDescription>{totalFriends} bạn bè</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {displayedFriends.map((friend) => (
            <Link
              key={friend.id}
              href={`/profile/${friend.id}`}
              className="flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-accent"
            >
              <Image
                src={friend.avatar_url || BLANK_AVATAR}
                alt={friend.display_name || "User"}
                width={64}
                height={64}
                className="rounded-full object-cover aspect-square"
              />
              <span className="text-sm font-medium truncate max-w-full text-center">
                {friend.display_name || friend.username}
              </span>
            </Link>
          ))}
        </div>

        {showViewAll && totalFriends > limit && (
          <Link
            href={`/profile/${userId}/friends`}
            className="block mt-4 text-center text-sm text-primary hover:underline"
          >
            Xem tất cả {totalFriends} bạn bè
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export default FriendsList;
