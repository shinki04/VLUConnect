import { Global_Roles } from "@repo/shared/types/user";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { formatPostDate } from "@repo/utils/formatDate";
import { Globe, LockKeyhole, Users } from "lucide-react";

import { PostOwnerDropdown } from "./Dropdown";
import { PostViewerDropdown } from "./Dropdown";

interface PostHeaderProps {
  author: {
    id: string;
    username: string | null; // Allow null
    display_name?: string | null; // Allow null
    avatar_url?: string | null; // Allow null
    global_role: Global_Roles | null; // Allow null
  };

  createdAt: string;
  privacyLevel: "public" | "friends" | "private";
  isOwner: boolean;
  onDelete: () => void;
  onUpdate: () => void;
}

const PRIVACY_CONFIG = {
  public: {
    alt: "Công khai",
    icon: Globe,
  },
  friends: {
    alt: "Bạn bè",
    icon: Users,
  },
  private: {
    alt: "Riêng tư",
    icon: LockKeyhole,
  },
} as const;

export default function PostHeader({
  author,
  createdAt,
  privacyLevel,
  isOwner,
  onDelete,
  onUpdate,
}: PostHeaderProps) {
  const formattedDate = formatPostDate(createdAt);
  const privacy = PRIVACY_CONFIG[privacyLevel];
  const PrivacyIcon = privacy.icon;

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
          <p className="font-semibold text-sm">
            {author?.display_name || author?.username}
          </p>
          <div className="flex flex-row items-center gap-1">
            <p className="text-xs text-gray-500">{formattedDate}</p>
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
          <PostViewerDropdown />
        )}
      </div>
    </div>
  );
}
