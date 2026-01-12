"use client";

import { Tables } from "@repo/shared/types/database.types";
import type { ConversationWithDetails } from "@repo/shared/types/messaging";
import AlertDialog from "@repo/ui/components/AlertDialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { cn } from "@repo/ui/lib/utils";
import {
  Crown,
  FileIcon,
  ImageIcon,
  Loader2,
  MoreVertical,
  Shield,
  Star,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  type ConversationMediaItem,
  getConversationMedia,
  type MemberRole,
  removeMemberFromGroup,
  transferAdmin,
  updateMemberRole,
} from "@/app/actions/messaging";
import { useConversation } from "@/hooks/useConversations";

interface GroupSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: ConversationWithDetails;
  currentUserId: string;
  onAddMember?: () => void;
}

type ConversationMemberWithProfile = ConversationWithDetails["members"][0];

/**
 * Get role badge for a member
 */
function RoleBadge({ role }: { role: string | null }) {
  if (role === "admin") {
    return (
      <Badge variant="default" className="gap-1 bg-amber-500 hover:bg-amber-600">
        <Crown className="h-3 w-3" />
        Admin
      </Badge>
    );
  }
  if (role === "sub_admin") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Star className="h-3 w-3" />
        Phó QTV
      </Badge>
    );
  }
  if (role === "moderator") {
    return (
      <Badge variant="outline" className="gap-1">
        <Shield className="h-3 w-3" />
        Điều hành
      </Badge>
    );
  }
  return null;
}

/**
 * Main group settings sheet component
 */
export function GroupSettingsSheet({
  open,
  onOpenChange,
  conversation,
  currentUserId,
  onAddMember,
}: GroupSettingsSheetProps) {
  const { refetch } = useConversation(conversation.id);
  const [activeTab, setActiveTab] = useState<"members" | "media">("members");
  const [isLoading, setIsLoading] = useState(false);
  
  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "remove" | "transfer" | "role";
    member: ConversationMemberWithProfile | null;
    newRole?: MemberRole;
  }>({ open: false, type: "remove", member: null });

  // Get current user's role
  const currentMember = conversation.members?.find(
    (m) => m.user_id === currentUserId
  );
  const currentRole = currentMember?.role as MemberRole | null;
  const isAdmin = currentRole === "admin";
  const canManage = isAdmin || currentRole === "sub_admin";

  // Sort members: admin first, then sub_admin, then moderator, then others
  const sortedMembers = [...(conversation.members || [])].sort((a, b) => {
    const roleOrder = { admin: 0, sub_admin: 1, moderator: 2, member: 3 };
    const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
    const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 3;
    return aOrder - bOrder;
  });

  const handleRemoveMember = useCallback(async () => {
    if (!confirmDialog.member) return;
    
    setIsLoading(true);
    try {
      await removeMemberFromGroup(conversation.id, confirmDialog.member.user_id);
      toast.success("Đã xóa thành viên khỏi nhóm");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa thành viên");
    } finally {
      setIsLoading(false);
      setConfirmDialog({ open: false, type: "remove", member: null });
    }
  }, [confirmDialog.member, conversation.id, refetch]);

  const handleTransferAdmin = useCallback(async () => {
    if (!confirmDialog.member) return;
    
    setIsLoading(true);
    try {
      await transferAdmin(conversation.id, confirmDialog.member.user_id);
      toast.success("Đã chuyển quyền quản trị");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể chuyển quyền");
    } finally {
      setIsLoading(false);
      setConfirmDialog({ open: false, type: "transfer", member: null });
    }
  }, [confirmDialog.member, conversation.id, refetch]);

  const handleUpdateRole = useCallback(async () => {
    if (!confirmDialog.member || !confirmDialog.newRole) return;
    
    setIsLoading(true);
    try {
      await updateMemberRole(conversation.id, confirmDialog.member.user_id, confirmDialog.newRole);
      toast.success("Đã cập nhật vai trò thành viên");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật vai trò");
    } finally {
      setIsLoading(false);
      setConfirmDialog({ open: false, type: "role", member: null });
    }
  }, [confirmDialog.member, confirmDialog.newRole, conversation.id, refetch]);

  const handleConfirm = useCallback(() => {
    if (confirmDialog.type === "remove") {
      handleRemoveMember();
    } else if (confirmDialog.type === "transfer") {
      handleTransferAdmin();
    } else if (confirmDialog.type === "role") {
      handleUpdateRole();
    }
  }, [confirmDialog.type, handleRemoveMember, handleTransferAdmin, handleUpdateRole]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {conversation.avatar_url ? (
                  <AvatarImage src={conversation.avatar_url} />
                ) : null}
                <AvatarFallback>
                  <Users className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-left">
                  {conversation.name || "Nhóm chat"}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {conversation.members?.length || 0} thành viên
                </p>
              </div>
            </div>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as "members" | "media")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members" className="gap-2">
                <Users className="h-4 w-4" />
                Thành viên
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Media
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-4 space-y-2">
              {canManage && onAddMember && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={onAddMember}
                >
                  <UserPlus className="h-4 w-4" />
                  Thêm thành viên
                </Button>
              )}

              <div className="space-y-1">
                {sortedMembers.map((member) => {
                  const profile = member.profile as Tables<"profiles">;
                  const isCurrentUser = member.user_id === currentUserId;
                  const memberRole = member.role as MemberRole | null;
                  const canManageThisMember =
                    canManage &&
                    !isCurrentUser &&
                    !(currentRole === "sub_admin" && memberRole === "admin");

                  return (
                    <div
                      key={member.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg hover:bg-muted/50",
                        isCurrentUser && "bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {profile?.avatar_url ? (
                            <AvatarImage src={profile.avatar_url} />
                          ) : null}
                          <AvatarFallback>
                            {(profile?.display_name || profile?.username || "?")
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {profile?.display_name || profile?.username}
                            </span>
                            {isCurrentUser && (
                              <span className="text-xs text-muted-foreground">(Bạn)</span>
                            )}
                          </div>
                          <RoleBadge role={memberRole} />
                        </div>
                      </div>

                      {canManageThisMember && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isAdmin && memberRole !== "admin" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    type: "transfer",
                                    member,
                                  })
                                }
                              >
                                <Crown className="h-4 w-4 mr-2 text-amber-500" />
                                Chuyển quyền Admin
                              </DropdownMenuItem>
                            )}
                            
                            {isAdmin && memberRole !== "sub_admin" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    type: "role",
                                    member,
                                    newRole: "sub_admin",
                                  })
                                }
                              >
                                <Star className="h-4 w-4 mr-2" />
                                Đặt làm Phó QTV
                              </DropdownMenuItem>
                            )}

                            {memberRole !== "moderator" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    type: "role",
                                    member,
                                    newRole: "moderator",
                                  })
                                }
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Đặt làm Điều hành viên
                              </DropdownMenuItem>
                            )}

                            {memberRole !== "member" && memberRole !== "admin" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    type: "role",
                                    member,
                                    newRole: "member",
                                  })
                                }
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Hạ xuống thành viên
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setConfirmDialog({
                                  open: true,
                                  type: "remove",
                                  member,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa khỏi nhóm
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-4">
              <GroupMediaGallery conversationId={conversation.id} />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open: boolean) =>
          !open && setConfirmDialog({ open: false, type: "remove", member: null })
        }
        title={
          confirmDialog.type === "remove"
            ? "Xóa thành viên?"
            : confirmDialog.type === "transfer"
            ? "Chuyển quyền quản trị?"
            : "Thay đổi vai trò?"
        }
        description={
          confirmDialog.type === "remove"
            ? `Bạn có chắc muốn xóa ${(confirmDialog.member?.profile as Tables<"profiles">)?.display_name || (confirmDialog.member?.profile as Tables<"profiles">)?.username} khỏi nhóm?`
            : confirmDialog.type === "transfer"
            ? `Bạn sẽ chuyển quyền quản trị cho ${(confirmDialog.member?.profile as Tables<"profiles">)?.display_name || (confirmDialog.member?.profile as Tables<"profiles">)?.username} và trở thành thành viên thường.`
            : `Bạn có chắc muốn thay đổi vai trò của ${(confirmDialog.member?.profile as Tables<"profiles">)?.display_name || (confirmDialog.member?.profile as Tables<"profiles">)?.username}?`
        }
        confirmText={isLoading ? "Đang xử lý..." : "Xác nhận"}
        cancelText="Hủy"
        onConfirm={handleConfirm}
      />
    </>
  );
}

/**
 * Media gallery component showing all shared files
 */
function GroupMediaGallery({ conversationId }: { conversationId: string }) {
  const [media, setMedia] = useState<ConversationMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<"all" | "image" | "video" | "file">("all");
  const [error, setError] = useState<string | null>(null);

  // Load media on mount
  const loadMedia = useCallback(async (before?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getConversationMedia(conversationId, 30, before);
      
      if (before) {
        setMedia((prev) => [...prev, ...result.items]);
      } else {
        setMedia(result.items);
      }
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải media");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Load media on mount
  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Filter media
  const filteredMedia = media.filter((item) => {
    if (filter === "all") return true;
    return item.fileType === filter;
  });

  const loadMore = useCallback(() => {
    const lastItem = media[media.length - 1];
    if (lastItem?.createdAt) {
      loadMedia(lastItem.createdAt);
    }
  }, [media, loadMedia]);

  if (isLoading && media.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{error}</p>
        <Button variant="link" onClick={() => loadMedia()}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Chưa có media nào được chia sẻ</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Tất cả
        </Button>
        <Button
          variant={filter === "image" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("image")}
        >
          <ImageIcon className="h-4 w-4 mr-1" />
          Ảnh
        </Button>
        <Button
          variant={filter === "video" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("video")}
        >
          <Video className="h-4 w-4 mr-1" />
          Video
        </Button>
        <Button
          variant={filter === "file" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("file")}
        >
          <FileIcon className="h-4 w-4 mr-1" />
          File
        </Button>
      </div>

      {/* Media grid */}
      <div className="grid grid-cols-3 gap-2">
        {filteredMedia.map((item) => (
          <a
            key={item.id}
            href={item.signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity group"
          >
            {item.fileType === "image" ? (
              <Image
                src={item.signedUrl}
                alt={item.fileName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 150px"
              />
            ) : item.fileType === "video" ? (
              <div className="flex items-center justify-center h-full">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-2">
                <FileIcon className="h-8 w-8 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground text-center truncate max-w-full">
                  {item.fileName}
                </span>
              </div>
            )}
            
            {/* Overlay with sender info */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs truncate">{item.senderName}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={loadMore}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Xem thêm
        </Button>
      )}
    </div>
  );
}
