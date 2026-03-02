import { ExploreGroup } from "@repo/shared/types/explore-groups";
import { Globe, Lock, ShieldX } from "lucide-react";
import Link from "next/link";
import React from "react";

interface GroupCardProps {
  group: ExploreGroup;
  onJoin?: (groupId: string) => void;
  isJoining?: boolean;
}
const PRIVACY_ICONS = {
  public: Globe,
  private: Lock,
  secret: ShieldX,
} as const;

export function GroupCard({ group, onJoin, isJoining }: GroupCardProps) {
  const {
    id,
    name,
    slug,
    description,
    cover_url,
    avatar_url,
    privacy_level,
    member_count,
    my_membership_status,
  } = group;

  const PrivacyIcon =
    PRIVACY_ICONS[privacy_level as keyof typeof PRIVACY_ICONS];

  // Decide what button to show
  const showJoinButton = my_membership_status === "none";
  const showPendingButton = my_membership_status === "pending";
  const showViewButton = my_membership_status === "active";

  return (
    <div className="group-card group h-full flex flex-col hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-700 rounded-xl">
      {/* Cover Image */}
      <Link href={`/groups/${slug}`}>
        <div className="group-card-cover h-32 w-full relative bg-gray-200 overflow-hidden rounded-t-xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
          {cover_url ? (
            <img
              src={cover_url}
              alt={`${name} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-300 dark:bg-slate-700"></div>
          )}
          <span className="absolute top-3 right-3 z-20 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 border border-white/20">
            <PrivacyIcon strokeWidth={1.3} />
            {/* {isPublic ? "Công khai" : "Riêng tư"} */}
          </span>
          {/* <PrivacyIcon
          size={20}
          className="absolute top-3 right-3 z-20 bg-black/40 backdrop-blur-sm text-white rounded-md flex items-center gap-1 border border-white/20"
        /> */}
        </div>
      </Link>

      {/* Content */}
      <div className="group-card-content p-4 flex flex-col flex-1">
        <div className="-mt-10 mb-3 relative z-20">
          {avatar_url ? (
            <img
              src={avatar_url}
              alt={name}
              className="w-14 h-14 rounded-xl border-4 border-white dark:border-surface-dark shadow-sm bg-white object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl border-4 border-white dark:border-dashboard-card shadow-sm bg-blue-500 flex items-center justify-center text-white text-xl font-bold uppercase">
              {name.substring(0, 2)}
            </div>
          )}
        </div>

        <Link
          href={`/groups/${slug}`}
          className="hover:text-mainred transition-colors"
        >
          <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-1">
            {name}
          </h3>
        </Link>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[32px]">
          {description || "Chưa có mô tả cho nhóm này."}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium gap-1">
            {/* <span className="material-symbols-outlined text-[16px]">group</span> */}
            {member_count} thành viên
          </div>
        </div>

        {/* Actions */}
        {showJoinButton && (
          <button
            onClick={() => onJoin?.(id)}
            disabled={isJoining}
            className="group-card-action-join mt-4 w-full py-2 font-semibold rounded-lg text-sm transition-all duration-200 bg-mainred/10 text-mainred hover:bg-mainred hover:text-white disabled:opacity-50 flex items-center justify-center"
          >
            {isJoining ? "Đang xử lý..." : "Tham gia"}
          </button>
        )}

        {showPendingButton && (
          <button
            disabled
            className="group-card-action-pending mt-4 w-full py-2 bg-gray-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400 font-semibold rounded-lg text-sm cursor-not-allowed border border-gray-200 dark:border-gray-700"
          >
            Đang chờ duyệt
          </button>
        )}

        {showViewButton && (
          <Link href={`/groups/${slug}`} className="w-full">
            <button className="group-card-action-view mt-4 w-full py-2 border border-gray-200 dark:border-gray-700 text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold rounded-lg text-sm transition-colors">
              Xem nhóm
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
