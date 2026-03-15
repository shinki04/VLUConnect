import { PRIVACY_CONFIG } from "@repo/shared/types/post";
import { BLANK_AVATAR, Global_Roles } from "@repo/shared/types/user";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { formatPostDate } from "@repo/utils/formatDate";
import { EyeOff, Globe, LockKeyhole, Users } from "lucide-react";
import Link from "next/link";

import { PostOwnerDropdown, PostViewerDropdown } from "./Dropdown";

const PRIVACY_ICONS = {
  Globe,
  Users,
  LockKeyhole,
} as const;

const ANONYMOUS_AVATAR =
  "https://api.dicebear.com/7.x/shapes/svg?seed=anonymous";

interface PostHeaderProps {
  postId: string;
  author: {
    id: string;
    username: string | null;
    slug?: string;
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
  isAnonymous?: boolean;
  isGlobalAdmin?: boolean;
  isPendingModeration?: boolean;
  canDelete?: boolean;
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
  isAnonymous = false,
  isGlobalAdmin = false,
  isPendingModeration = false,
  canDelete = false,
}: PostHeaderProps) {
  const displayTime = updatedAt || createdAt;
  const formattedDate = formatPostDate(displayTime);
  const isEdited = !!updatedAt && updatedAt !== createdAt;

  const privacy = PRIVACY_CONFIG[privacyLevel];
  const PrivacyIcon = PRIVACY_ICONS[privacy.icon as keyof typeof PRIVACY_ICONS];

  // Determine display values based on anonymous status
  const shouldHideIdentity = isAnonymous && !isGlobalAdmin;

  const displayName = shouldHideIdentity
    ? "Thành viên ẩn danh"
    : author?.display_name || author?.username;
  const displayAvatar = shouldHideIdentity
    ? ANONYMOUS_AVATAR
    : author?.avatar_url || BLANK_AVATAR;

  const profileLink = shouldHideIdentity
    ? ""
    : `/profile/${author?.slug || author?.id || ""}`;

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <Avatar>
            <AvatarImage
              src={displayAvatar}
              alt={displayName || "User Avatar"}
            />
            <AvatarFallback>{shouldHideIdentity ? "?" : "U"}</AvatarFallback>
          </Avatar>
        </div>
        <div>
          {/* Author name with optional group context - like Facebook style */}
          <div className="font-semibold text-sm flex items-center gap-1 flex-wrap">
            {profileLink ? (
              <Link href={profileLink} className="hover:underline">
                {displayName}
              </Link>
            ) : (
              <span className="text-muted-foreground">{displayName}</span>
            )}
            {/* Show badge for global admin viewing anonymous post */}
            {isAnonymous && isGlobalAdmin && (
              <Badge variant="outline" className="text-xs ml-1 gap-1">
                <EyeOff className="w-3 h-3" />
                Ẩn danh
              </Badge>
            )}
            {group && (
              <>
                <span className="text-muted-foreground font-normal mx-1">
                  đã đăng trong
                </span>
                <Link
                  href={`/groups/${group.slug}`}
                  className="hover:underline text-primary"
                >
                  {group.name}
                </Link>
              </>
            )}
          </div>
          <div className="flex flex-row items-center gap-1">
            <p className="text-xs text-gray-500">
              {formattedDate} &middot;
              {isEdited && <span className="italic ml-1">(đã chỉnh sửa)</span>}
            </p>
            <label title={privacy.alt}>
              <PrivacyIcon width={15} color="#9e9e9e" />
            </label>
          </div>
        </div>
      </div>
      <div>
        {!isPendingModeration &&
          (isOwner ? (
            <PostOwnerDropdown onUpdate={onUpdate} onDelete={onDelete} />
          ) : (
            <PostViewerDropdown
              postId={postId}
              canDelete={canDelete}
              onDelete={onDelete}
            />
          ))}
      </div>
    </div>
  );
}
