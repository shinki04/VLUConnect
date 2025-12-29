import { PRIVACY_CONFIG } from "@repo/shared/types/post";
import { Global_Roles } from "@repo/shared/types/user";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { formatPostDate } from "@repo/utils/formatDate";
import { Globe, LockKeyhole, Users } from "lucide-react";
import Link from "next/link";

import { PostOwnerDropdown, PostViewerDropdown } from "./Dropdown";

const PRIVACY_ICONS = {
  Globe,
  Users,
  LockKeyhole,
} as const;

interface PostHeaderProps {
  postId: string;
  author: {
    id: string;
    username: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    global_role: Global_Roles | null;
  };
  createdAt: string;
  updatedAt?: string | null;
  privacyLevel: "public" | "friends" | "private";
  isOwner: boolean;
  onDelete: () => void;
  onUpdate: () => void;
  group?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}



export default function PostHeader({
  postId,
  author,
  createdAt,
  updatedAt,
  privacyLevel,
  isOwner,
  onDelete,
  onUpdate,
  group,
}: PostHeaderProps) {
  const displayTime = updatedAt || createdAt;
  const formattedDate = formatPostDate(displayTime);
  const isEdited = !!updatedAt && updatedAt !== createdAt;

  const privacy = PRIVACY_CONFIG[privacyLevel];
  const PrivacyIcon = PRIVACY_ICONS[privacy.icon as keyof typeof PRIVACY_ICONS];

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <Avatar>
            <AvatarImage
              src={author?.avatar_url || "/next.svg"}
              alt={author?.display_name || author?.username || "User Avatar"}
            />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
        <div>
          {/* Author name with optional group context - like Facebook style */}
          <p className="font-semibold text-sm">
            <Link href={`/profile/${author?.username}`} className="hover:underline">
              {author?.display_name || author?.username}
            </Link>
            {group && (
              <>
                <span className="text-muted-foreground font-normal mx-1">đã đăng trong</span>
                <Link href={`/groups/${group.slug}`} className="hover:underline text-primary">
                  {group.name}
                </Link>
              </>
            )}
          </p>
          <div className="flex flex-row items-center gap-1">
            <p className="text-xs text-gray-500">
              {formattedDate}
              {isEdited && <span className="italic ml-1">(đã chỉnh sửa)</span>}
            </p>
            <label title={privacy.alt}>
              <PrivacyIcon width={15} color="#9e9e9e" />
            </label>
          </div>
        </div>
      </div>
      <div>
        {isOwner ? (
          <PostOwnerDropdown onUpdate={onUpdate} onDelete={onDelete} />
        ) : (
          <PostViewerDropdown postId={postId} />
        )}
      </div>
    </div>
  );
}
