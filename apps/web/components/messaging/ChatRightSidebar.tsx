"use client";

import { Tables } from "@repo/shared/types/database.types";
import type { ConversationWithDetails } from "@repo/shared/types/messaging";
import AlertDialog from "@repo/ui/components/AlertDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { cn } from "@repo/ui/lib/utils";
import {
    Crown,
    FileIcon,
    Image as ImageIcon,
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

interface ChatRightSidebarProps {
    conversation: ConversationWithDetails;
    currentUserId: string;
    isOpen: boolean;
    onClose?: () => void;
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

export function ChatRightSidebar({
    conversation,
    currentUserId,
    isOpen,
    onClose,
    onAddMember,
}: ChatRightSidebarProps) {
    const { refetch } = useConversation(conversation.id);
    const [isLoading, setIsLoading] = useState(false);

    // Media state
    const [mediaItems, setMediaItems] = useState<ConversationMediaItem[]>([]);
    const [isMediaLoading, setIsMediaLoading] = useState(true);

    // Dialog states
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: "remove" | "transfer" | "role";
        member: ConversationMemberWithProfile | null;
        newRole?: MemberRole;
    }>({ open: false, type: "remove", member: null });

    const isGroup = conversation.type === "group";

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

    // Load media on mount or conversation change
    useEffect(() => {
        const fetchMedia = async () => {
            try {
                setIsMediaLoading(true);
                const result = await getConversationMedia(conversation.id, 50);
                setMediaItems(result.items);
            } catch (error) {
                console.error("Failed to load media:", error);
            } finally {
                setIsMediaLoading(false);
            }
        };
        fetchMedia();
    }, [conversation.id]);

    // Determine display info
    let displayName = "Nhóm chat";
    let avatarUrl: string | null = null;
    let subtitle = "Thông tin nhóm";

    if (isGroup) {
        displayName = conversation.name || "Nhóm chat";
        avatarUrl = conversation.avatar_url;
        subtitle = "Thông tin nhóm";
    } else {
        const otherMember = conversation.members?.find((m) => m.user_id !== currentUserId);
        const profile = otherMember?.profile as Tables<"profiles"> | undefined;
        displayName = profile?.display_name || profile?.username || "Người dùng";
        avatarUrl = profile?.avatar_url || null;
        subtitle = "Người dùng";
    }

    const [viewState, setViewState] = useState<"overview" | "media">("overview");
    const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video" | "file">("all");

    // Split media
    const visualMedia = mediaItems.filter(m => m.fileType === "image" || m.fileType === "video");
    const documentMedia = mediaItems.filter(m => m.fileType === "file");

    return (
        <>
            <div
                className={cn(
                    "flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 shrink-0 transition-all duration-300 ease-in-out z-50 md:z-20",
                    "absolute top-0 right-0 bottom-0 w-full md:w-[320px]",
                    isOpen
                        ? "translate-x-0 opacity-100 md:relative"
                        : "translate-x-[120%] opacity-0 pointer-events-none"
                )}
            >
                {/* Header Profile section */}
                {viewState === "overview" ? (
                    <div className="flex flex-col items-center justify-center pt-8 pb-4 relative">
                        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </Button>

                        <Avatar className="h-[72px] w-[72px] mb-3 shadow-sm border border-slate-100">
                            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />}
                            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                                {isGroup ? <Users size={28} /> : displayName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="text-[17px] font-bold text-slate-900 dark:text-slate-100 text-center mb-1">
                            {displayName}
                        </h2>
                        <p className="text-[13px] text-slate-500 font-normal">
                            {subtitle}
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center p-4 border-b border-slate-100 dark:border-slate-800">
                        <Button variant="ghost" size="icon" onClick={() => setViewState("overview")} className="h-8 w-8 mr-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </Button>
                        <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
                            {mediaFilter === "file" ? "Tài liệu đã gửi" : "Media"}
                        </h2>
                    </div>
                )}

                {/* Scrollable content areas */}
                <div className="flex-1 w-full overflow-y-auto overflow-x-hidden custom-scrollbar pb-6 px-5 space-y-6">
                    {viewState === "overview" ? (
                        <>
                            {/* Media & Files Grid */}
                            <div className="space-y-3 mt-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold text-slate-500 tracking-wider flex items-center gap-2 uppercase">
                                        <ImageIcon className="h-4 w-4" />
                                        Media
                                    </h3>
                                    {visualMedia.length > 0 && (
                                        <button
                                            className="text-[11px] font-bold text-[#C81D31] hover:underline uppercase"
                                            onClick={() => {
                                                setMediaFilter("all");
                                                setViewState("media");
                                            }}
                                        >
                                            XEM TẤT CẢ
                                        </button>
                                    )}
                                </div>

                                {isMediaLoading ? (
                                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
                                ) : visualMedia.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {visualMedia.slice(0, 6).map((item) => (
                                            <a
                                                key={item.id}
                                                href={item.signedUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="relative aspect-square rounded-md overflow-hidden bg-slate-100 hover:opacity-90 transition-opacity"
                                            >
                                                {item.fileType === "image" ? (
                                                    <Image
                                                        src={item.signedUrl}
                                                        alt={item.fileName}
                                                        fill
                                                        className="object-cover"
                                                        sizes="100px"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <Video className="h-6 w-6 text-slate-400" />
                                                    </div>
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[12px] text-slate-500 italic px-1 text-center bg-transparent mt-2">
                                        Chưa có tài liệu/hình ảnh nào trong cuộc hội thoại
                                    </p>
                                )}
                            </div>

                            {/* Documents List */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold text-slate-500 tracking-wider flex items-center gap-2 uppercase">
                                        <FileIcon className="h-4 w-4" />
                                        Tài liệu đã gửi
                                    </h3>
                                    {documentMedia.length > 0 && (
                                        <button
                                            className="text-[11px] font-bold text-[#C81D31] hover:underline uppercase"
                                            onClick={() => {
                                                setMediaFilter("file");
                                                setViewState("media");
                                            }}
                                        >
                                            XEM TẤT CẢ
                                        </button>
                                    )}
                                </div>

                                {documentMedia.length > 0 ? (
                                    <div className="space-y-2">
                                        {documentMedia.slice(0, 3).map((item) => (
                                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#fff4f5] dark:bg-red-950/20 border border-transparent hover:border-red-100 transition-colors">
                                                <div className="h-10 w-10 shrink-0 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-[#C81D31] border border-slate-100 dark:border-slate-800">
                                                    <FileIcon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[14px] font-medium text-slate-900 dark:text-slate-100 truncate mb-[2px]">{item.fileName}</h4>
                                                    <p className="text-[12px] text-slate-500 font-normal">2.4 MB • 12:00</p>
                                                </div>
                                                <a href={item.signedUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-[#C81D31]">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[12px] text-slate-500 italic px-1 text-center bg-transparent mt-2">
                                        Chưa có tài liệu/hình ảnh nào trong cuộc hội thoại
                                    </p>
                                )}
                            </div>

                            {/* Members List */}
                            {isGroup && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-semibold text-slate-500 tracking-wider flex items-center gap-2 uppercase">
                                            <Users className="h-4 w-4" />
                                            Thành viên ({conversation.members?.length || 0})
                                        </h3>
                                        <button className="text-[11px] font-bold text-[#C81D31] hover:underline uppercase">
                                            TẤT CẢ
                                        </button>
                                    </div>

                                    <div className="space-y-1">
                                        {sortedMembers.slice(0, 4).map((member) => {
                                            const profile = member.profile as Tables<"profiles">;
                                            const isCurrentUser = member.user_id === currentUserId;
                                            const memberRole = member.role as MemberRole | null;
                                            const canManageThisMember = canManage && !isCurrentUser && !(currentRole === "sub_admin" && memberRole === "admin");

                                            return (
                                                <div key={member.id} className="flex items-center justify-between py-2 group">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            {profile?.avatar_url ? (
                                                                <AvatarImage src={profile.avatar_url} className="object-cover" />
                                                            ) : null}
                                                            <AvatarFallback>
                                                                {(profile?.display_name || profile?.username || "?").substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-[14px] text-slate-900 dark:text-slate-100">
                                                                {profile?.display_name || profile?.username}
                                                            </span>
                                                            {memberRole === "admin" && <span className="text-[10px] font-bold text-[#C81D31] uppercase tracking-wider">Admin</span>}
                                                            {memberRole === "sub_admin" && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phó QTV</span>}
                                                        </div>
                                                    </div>

                                                    {canManageThisMember && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {isAdmin && memberRole !== "admin" && (
                                                                    <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, type: "transfer", member })}>
                                                                        <Crown className="h-4 w-4 mr-2 text-amber-500" /> Chuyển quyền Admin
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {isAdmin && memberRole !== "sub_admin" && (
                                                                    <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, type: "role", member, newRole: "sub_admin" })}>
                                                                        <Star className="h-4 w-4 mr-2" /> Đặt làm Phó QTV
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {memberRole !== "moderator" && (
                                                                    <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, type: "role", member, newRole: "moderator" })}>
                                                                        <Shield className="h-4 w-4 mr-2" /> Đặt làm Điều hành viên
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {memberRole !== "member" && memberRole !== "admin" && (
                                                                    <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, type: "role", member, newRole: "member" })}>
                                                                        <UserMinus className="h-4 w-4 mr-2" /> Hạ xuống thành viên
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmDialog({ open: true, type: "remove", member })}>
                                                                    <Trash2 className="h-4 w-4 mr-2" /> Xóa khỏi nhóm
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {isGroup && (
                                <div className="flex flex-col gap-2 pt-2 pb-6">
                                    {canManage && onAddMember && (
                                        <Button
                                            className="w-full bg-[#C81D31] hover:bg-[#a51526] text-white font-semibold rounded-xl h-11"
                                            onClick={onAddMember}
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Thêm thành viên
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="w-full text-[#C81D31] hover:text-[#C81D31] hover:bg-red-50 font-semibold rounded-xl h-11 border-slate-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                        Rời nhóm
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="mt-2">
                            <GroupMediaGallery
                                conversationId={conversation.id}
                                initialFilter={mediaFilter}
                            />
                        </div>
                    )}
                </div>
            </div>

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
function GroupMediaGallery({
    conversationId,
    initialFilter = "all"
}: {
    conversationId: string;
    initialFilter?: "all" | "image" | "video" | "file";
}) {
    const [media, setMedia] = useState<ConversationMediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [filter, setFilter] = useState<"all" | "image" | "video" | "file">(initialFilter);
    const [error, setError] = useState<string | null>(null);

    // Update filter when prop changes
    useEffect(() => {
        setFilter(initialFilter);
    }, [initialFilter]);

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
            <div className="flex flex-wrap gap-2">
                {initialFilter !== "file" && (
                    <>
                        <Button
                            variant={filter === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter("all")}
                            className={filter === "all" ? "bg-[#C81D31] hover:bg-[#a51526] text-white border-transparent" : "border-slate-200 text-slate-700 hover:bg-slate-100"}
                        >
                            Tất cả
                        </Button>
                        <Button
                            variant={filter === "image" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter("image")}
                            className={filter === "image" ? "bg-[#C81D31] hover:bg-[#a51526] text-white border-transparent" : "border-slate-200 text-slate-700 hover:bg-slate-100"}
                        >
                            <ImageIcon className="h-4 w-4 mr-1" />
                            Ảnh
                        </Button>
                        <Button
                            variant={filter === "video" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter("video")}
                            className={filter === "video" ? "bg-[#C81D31] hover:bg-[#a51526] text-white border-transparent" : "border-slate-200 text-slate-700 hover:bg-slate-100"}
                        >
                            <Video className="h-4 w-4 mr-1" />
                            Video
                        </Button>
                    </>
                )}
                {initialFilter !== "all" && (
                    <Button
                        variant={filter === "file" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("file")}
                        className={filter === "file" ? "bg-[#C81D31] hover:bg-[#a51526] text-white border-transparent" : "border-slate-200 text-slate-700 hover:bg-slate-100"}
                    >
                        <FileIcon className="h-4 w-4 mr-1" />
                        File
                    </Button>
                )}
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
                            <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800">
                                <Video className="h-8 w-8 text-slate-400" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-2 bg-slate-100 dark:bg-slate-800">
                                <FileIcon className="h-8 w-8 text-slate-400 mb-1" />
                                <span className="text-[10px] text-slate-500 text-center truncate w-full">
                                    {item.fileName}
                                </span>
                            </div>
                        )}

                        {/* Overlay with sender info */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-[10px] truncate">{item.senderName}</p>
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
