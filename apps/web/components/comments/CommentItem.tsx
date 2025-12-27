"use client";

import AlertDialog from "@repo/ui/components/AlertDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Textarea } from "@repo/ui/components/textarea";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronDown, ChevronUp, Edit2, Flag, MoreHorizontal, SendHorizontal, Trash2 } from "lucide-react";
import React, { useState } from "react";

import { useGetCurrentUser } from "@/hooks/useAuth";

export interface Comment {
    id: string;
    content: string;
    user_id: string;
    post_id: string;
    like_count: number;
    reply_count: number;
    is_liked?: boolean;
    created_at: string | null;
    updated_at: string | null;
    parent_id: string | null;
    is_edited: boolean | null;
    author: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
    children?: Comment[];
}

interface CommentItemProps {
    comment: Comment;
    onReply: (authorName: string, parentId: string) => void;
    onDelete: (commentId: string) => void;
    onEdit: (commentId: string, content: string) => void;
    onLike: (commentId: string, isLiked: boolean) => void;
    depth?: number;
}

// Configuration: number of replies to show before collapsing
const REPLIES_THRESHOLD = 2;

export function CommentItem({ comment, onReply, onDelete, onEdit, onLike, depth = 0 }: CommentItemProps) {
    const { data: currentUser } = useGetCurrentUser();
    const isOwner = currentUser?.id === comment.user_id;
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [openAlert, setOpenAlert] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    const dateToUse = comment.updated_at || comment.created_at || new Date().toISOString();
    const timeAgo = formatDistanceToNow(new Date(dateToUse), { addSuffix: true, locale: vi });

    const handleSaveEdit = () => {
        if (!editContent.trim()) return;
        onEdit(comment.id, editContent);
        setIsEditing(false);
    };

    const childrenCount = comment.children?.length || 0;
    const hasChildren = childrenCount > 0;
    const shouldCollapse = childrenCount > REPLIES_THRESHOLD;

    return (
        <div className="flex gap-3">
            <Avatar className="w-8 h-8 cursor-pointer shrink-0">
                <AvatarImage src={comment.author.avatar_url || ""} />
                <AvatarFallback>{comment.author.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                    <div className="group">
                        <div className="bg-muted/50 dark:bg-muted/30 rounded-2xl px-3 py-2 w-fit max-w-full">
                            <div className="flex flex-col w-full">
                                <span className="font-semibold text-sm cursor-pointer hover:underline mb-1">
                                    {comment.author.display_name || comment.author.username}
                                </span>
                                {isEditing ? (
                                    <div className="w-full mt-1">
                                        <div className="flex gap-2 items-end">
                                            <Textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="min-h-[40px] max-h-[120px] resize-none py-2 bg-muted/30 focus:bg-background transition-colors text-sm"
                                                autoFocus
                                                onFocus={(e) => {
                                                    const val = e.target.value;
                                                    e.target.setSelectionRange(val.length, val.length);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSaveEdit();
                                                    }
                                                    if (e.key === 'Escape') {
                                                        setIsEditing(false);
                                                    }
                                                }}
                                            />
                                            <div className="flex flex-col gap-1 shrink-0 mb-[2px]">
                                                <Button
                                                    size="icon"
                                                    onClick={handleSaveEdit}
                                                    disabled={!editContent.trim() || editContent === comment.content}
                                                    className="h-8 w-8"
                                                >
                                                    <SendHorizontal className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setIsEditing(false)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                >
                                                    <span className="sr-only">Hủy</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 ml-2">
                            <span className="text-xs text-muted-foreground">{timeAgo}</span>
                            {comment.is_edited && (
                                <span className="text-xs text-muted-foreground italic">(đã chỉnh sửa)</span>
                            )}
                            
                            <button 
                                onClick={() => onLike(comment.id, comment.is_liked || false)}
                                className={`text-xs font-semibold cursor-pointer hover:underline flex items-center gap-1 ${comment.is_liked ? "text-red-500" : "text-muted-foreground"}`}
                            >
                                {comment.is_liked ? "Đã thích" : "Thích"}
                                {(comment.like_count || 0) > 0 && <span>({comment.like_count})</span>}
                            </button>

                            <span 
                                className="text-xs font-semibold cursor-pointer hover:underline text-muted-foreground"
                                onClick={() => onReply(comment.author.display_name || comment.author.username, comment.id)}
                            >
                                Trả lời
                            </span>
                            
                            {!isEditing && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-3 h-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {isOwner ? (
                                            <>
                                                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                                    <Edit2 className="w-4 h-4 mr-2" />
                                                    Chỉnh sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setOpenAlert(true)} className="text-red-500 hover:text-red-600">
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Xóa bình luận
                                                </DropdownMenuItem>
                                            </>
                                        ) : (
                                            <DropdownMenuItem onClick={() => console.log("Report")} className="text-red-500 hover:text-red-600">
                                                <Flag className="w-4 h-4 mr-2" />
                                                Báo cáo
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>

                {/* Child comments with expand/collapse */}
                {hasChildren && (
                    <div className={`mt-2 ${depth < 2 ? "pl-4 border-l-2 border-muted" : "-ml-[2.75rem]"}`}>
                        {/* Show/Hide toggle button for many replies */}
                        {shouldCollapse && !showReplies && (
                            <button
                                onClick={() => setShowReplies(true)}
                                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline mb-2 py-1"
                            >
                                <ChevronDown className="w-3 h-3" />
                                Xem {childrenCount} phản hồi
                            </button>
                        )}

                        {/* Show replies if: few replies OR expanded */}
                        {(!shouldCollapse || showReplies) && (
                            <>
                                {comment.children!.map(child => (
                                    <CommentItem 
                                        key={child.id} 
                                        comment={child} 
                                        onReply={onReply}
                                        onDelete={onDelete}
                                        onEdit={onEdit}
                                        onLike={onLike}
                                        depth={depth + 1}
                                    />
                                ))}
                                
                                {/* Collapse button when expanded */}
                                {shouldCollapse && showReplies && (
                                    <button
                                        onClick={() => setShowReplies(false)}
                                        className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary hover:underline mt-2 py-1"
                                    >
                                        <ChevronUp className="w-3 h-3" />
                                        Ẩn phản hồi
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            <AlertDialog
                open={openAlert}
                onOpenChange={setOpenAlert}
                title="Xóa bình luận?"
                description="Bạn có chắc muốn xóa bình luận này không?"
                onConfirm={() => onDelete(comment.id)}
            />
        </div>
    );
}
