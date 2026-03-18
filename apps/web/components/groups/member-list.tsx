"use client";


import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Crown, MoreHorizontal, Search,Shield, ShieldCheck, User } from "lucide-react";
import { useState } from "react";

import { UserCard } from "@/components/user-card";
import {
  useGroupMemberActions,
  useGroupMembers,
  usePendingMembers,
} from "@/hooks/useGroup";

interface MemberListProps {
  groupId: string;
  currentUserRole: "admin" | "sub_admin" | "moderator" | "member" | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  sub_admin: "Phó Admin",
  moderator: "Điều hành",
  member: "Thành viên",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Crown className="w-3 h-3" />,
  sub_admin: <ShieldCheck className="w-3 h-3" />,
  moderator: <Shield className="w-3 h-3" />,
  member: <User className="w-3 h-3" />,
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  sub_admin: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  moderator: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  member: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

export function MemberList({ groupId, currentUserRole }: MemberListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: members = [], isLoading } = useGroupMembers(groupId);
  const { data: pendingMembers = [] } = usePendingMembers(groupId);
  const actions = useGroupMemberActions(groupId);

  const canManage = ["admin", "sub_admin", "moderator"].includes(
    currentUserRole || "",
  );
  const isAdmin = currentUserRole === "admin";

  const filteredMembers = members.filter((member) => {
    const name = member.profile?.display_name || member.profile?.username || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="text-center py-10 text-muted-foreground">Đang tải...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests Section */}
      {canManage && pendingMembers.length > 0 && (
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              Yêu cầu tham gia ({pendingMembers.length})
            </h3>
            {["admin", "sub_admin"].includes(currentUserRole || "") &&
              pendingMembers.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => actions.approveAllMembers()}
                  disabled={actions.isApprovingAll}
                >
                  {actions.isApprovingAll ? "Đang duyệt..." : "Duyệt tất cả"}
                </Button>
              )}
          </div>
          <div className="space-y-3">
            {pendingMembers.map((member) => (
              <UserCard
                key={member.user_id}
                user={{
                  id: member.profile?.id || member.user_id,
                  slug: member.profile?.slug,
                  displayName: member.profile?.display_name,
                  username: member.profile?.username,
                  avatarUrl: member.profile?.avatar_url,
                }}
                className="bg-muted/50 border-0"
                rightAction={
                  <>
                    <Button
                      size="sm"
                      onClick={() => actions.approveMember(member.user_id)}
                      disabled={actions.isApproving}
                    >
                      Chấp nhận
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => actions.rejectMember(member.user_id)}
                      disabled={actions.isRejecting}
                    >
                      Từ chối
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Members Section */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="md:font-semibold text-sm sm:font-normal">
            Thành viên ({members.length})
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm thành viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full h-9 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          {filteredMembers.map((member) => (
            <UserCard
              key={member.user_id}
              className="border-0"
              user={{
                id: member.profile?.id || member.user_id,
                slug: member.profile?.slug,
                displayName: member.profile?.display_name,
                username: member.profile?.username,
                avatarUrl: member.profile?.avatar_url,
              }}
              rightAction={
                <>
                  <Badge
                    variant="outline"
                    className={`${ROLE_COLORS[member.role]} flex items-center gap-1`}
                  >
                    {ROLE_ICONS[member.role]}
                    <span className="hidden sm:inline">
                      {ROLE_LABELS[member.role]}
                    </span>
                  </Badge>

                  {canManage && member.role !== "admin" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isAdmin && member.role !== "sub_admin" && (
                          <DropdownMenuItem
                            onClick={() =>
                              actions.updateRole({
                                userId: member.user_id,
                                role: "sub_admin",
                              })
                            }
                          >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Thăng Phó Admin
                          </DropdownMenuItem>
                        )}
                        {(isAdmin || currentUserRole === "sub_admin") &&
                          member.role !== "moderator" && (
                            <DropdownMenuItem
                              onClick={() =>
                                actions.updateRole({
                                  userId: member.user_id,
                                  role: "moderator",
                                })
                              }
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Thăng Điều hành
                            </DropdownMenuItem>
                          )}
                        {member.role !== "member" && (
                          <DropdownMenuItem
                            onClick={() =>
                              actions.updateRole({
                                userId: member.user_id,
                                role: "member",
                              })
                            }
                          >
                            <User className="w-4 h-4 mr-2" />
                            Hạ xuống Thành viên
                          </DropdownMenuItem>
                        )}
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (
                                  confirm(
                                    `Bạn có chắc muốn chuyển quyền Admin cho ${member.profile?.display_name}?`,
                                  )
                                ) {
                                  actions.transferAdmin(member.user_id);
                                }
                              }}
                            >
                              <Crown className="w-4 h-4 mr-2" />
                              Chuyển quyền Admin
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (
                              confirm("Bạn có chắc muốn xóa thành viên này?")
                            ) {
                              actions.removeMember(member.user_id);
                            }
                          }}
                        >
                          Xóa khỏi group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              }
            />
          ))}

          {filteredMembers.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              {searchQuery
                ? "Không tìm thấy thành viên nào"
                : "Chưa có thành viên nào"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
