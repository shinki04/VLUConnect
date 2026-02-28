"use client";

import { Tables } from "@repo/shared/types/database.types";
import type {
  MessageWithSender,
  OptimisticMessage,
} from "@repo/shared/types/messaging";
import AlertDialog from "@repo/ui/components/AlertDialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import { formatMessageTime } from "@repo/utils/formatDate";
import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Check, Edit2, Flag, Loader2, MoreVertical, Reply, RotateCcw, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ReportDialog } from "@/components/reports/ReportDialog";
import { useModerationReason } from "@/hooks/useModerationReason";

import { MediaAttachment } from "./MediaAttachment";

interface MessageBubbleProps {
  message: MessageWithSender | OptimisticMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onRetry?: (tempId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  onRecallMessage?: (messageId: string) => Promise<void>;
  onReply?: (message: MessageWithSender | OptimisticMessage) => void;
}

/**
 * Single message bubble with styling for sent/received messages
 * Supports optimistic UI with sending/failed states and retry button
 */
export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  onRetry,
  onEditMessage,
  onRecallMessage,
  onReply,
}: MessageBubbleProps) {
  const isOptimistic = "tempId" in message;
  const status = isOptimistic ? message.status : "sent";
  const sender = message.sender as Tables<"profiles"> | undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showRecallDialog, setShowRecallDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const messageId = "id" in message ? message.id : undefined;

  // Listen for highlight events from other messages
  useEffect(() => {
    const handleHighlight = (e: CustomEvent<string>) => {
      if (messageId && e.detail === messageId) {
        setIsHighlighted(true);
        setTimeout(() => setIsHighlighted(false), 2000);
      }
    };
    window.addEventListener(
      "highlight-message" as string,
      handleHighlight as EventListener,
    );
    return () =>
      window.removeEventListener(
        "highlight-message" as string,
        handleHighlight as EventListener,
      );
  }, [messageId]);

  const handleRetry = () => {
    if (isOptimistic && message.tempId && onRetry) {
      onRetry(message.tempId);
    }
  };

  const handleEdit = async () => {
    if (
      !editContent?.trim() ||
      editContent === message.content ||
      !messageId ||
      !onEditMessage
    ) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onEditMessage(messageId, editContent);
      toast.success("Đã chỉnh sửa tin nhắn");
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi chỉnh sửa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecall = async () => {
    if (!messageId || !onRecallMessage) return;
    setIsLoading(true);
    try {
      await onRecallMessage(messageId);
      toast.success("Đã thu hồi tin nhắn");
      setShowRecallDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi thu hồi");
    } finally {
      setIsLoading(false);
    }
  };

  const canShowMenu =
    !isOptimistic &&
    status !== "sending" &&
    status !== "failed" &&
    !message.is_deleted;

  return (
    <>
      <motion.div
        id={messageId ? `message-${messageId}` : undefined}
        className={cn(
          "flex items-end gap-2 group",
          isOwn ? "flex-row-reverse" : "flex-row",
        )}
        animate={{
          backgroundColor: isHighlighted
            ? "rgba(234, 179, 8, 0.3)"
            : "transparent",
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Avatar */}
        {showAvatar && !isOwn ? (
          <Avatar className="h-8 w-8 shrink-0">
            {sender?.avatar_url ? (
              <AvatarImage
                src={sender.avatar_url}
                alt={sender.display_name || ""}
              />
            ) : null}
            <AvatarFallback className="text-xs">
              {(sender?.display_name || sender?.username || "U")
                .substring(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 shrink-0" />
        )}

        {/* Message content */}
        <div
          className={cn(
            "max-w-[75%] relative",
            isOwn ? "chat-bubble-self" : "chat-bubble-other",
            status === "failed" &&
              "bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800",
            status === "sending" && "opacity-70",
          )}
        >
          {/* Sender name for group chats (if not own message) */}
          {!isOwn && sender && (
            <p className="text-xs font-medium text-muted-foreground mb-0.5">
              {sender.display_name || sender.username}
            </p>
          )}

          {/* Replied message quote - click to scroll to parent */}
          {message.reply_to && message.reply_to.id && !message.is_deleted && (
            <div
              className={cn(
                "mb-2 p-2 rounded-lg border-l-2 cursor-pointer hover:opacity-80 transition-opacity",
                isOwn
                  ? "bg-white/20 border-white/50"
                  : "bg-black/5 dark:bg-white/5 border-slate-300 dark:border-slate-600",
              )}
              onClick={() => {
                // Find and scroll to parent message
                const parentElement = document.getElementById(
                  `message-${message.reply_to!.id}`,
                );
                if (parentElement) {
                  parentElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  // Dispatch custom event to trigger highlight
                  window.dispatchEvent(
                    new CustomEvent("highlight-message", {
                      detail: message.reply_to!.id,
                    }),
                  );
                }
              }}
            >
              <p
                className={cn(
                  "text-[11px] font-semibold mb-0.5",
                  isOwn ? "text-white" : "text-slate-700 dark:text-slate-300",
                )}
              >
                {message.reply_to.sender?.display_name ||
                  message.reply_to.sender?.username ||
                  "Người dùng"}
              </p>
              <p
                className={cn(
                  "text-xs line-clamp-2",
                  isOwn
                    ? "text-white/90"
                    : "text-slate-600 dark:text-slate-400",
                  message.reply_to.is_deleted && "italic",
                )}
              >
                {message.reply_to.is_deleted
                  ? "Tin nhắn đã thu hồi"
                  : message.reply_to.content}
              </p>
            </div>
          )}

          {/* Message content or edit input */}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="h-7 text-sm bg-background text-foreground"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleEdit();
                  }
                  if (e.key === "Escape") {
                    setIsEditing(false);
                    setEditContent(message.content || "");
                  }
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleEdit}
                disabled={isLoading}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content || "");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : message.is_deleted ? (
            <DeletedMessageContent messageId={message.id} />
          ) : (
            <>
              {message.content && (
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}

              {/* Pending files (uploading) */}
              {"pendingFiles" in message &&
                message.pendingFiles &&
                message.pendingFiles.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    {message.pendingFiles.map((pf) => (
                      <MediaAttachment
                        key={pf.id}
                        pendingFile={pf}
                        isOwn={isOwn}
                      />
                    ))}
                  </div>
                )}

              {/* Completed media attachments */}
              {message.media_urls && message.media_urls.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {message.media_urls.map((url, idx) => (
                    <MediaAttachment
                      key={`${url}-${idx}`}
                      url={url}
                      isOwn={isOwn}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Timestamp and status */}
          <div
            className={cn(
              "flex items-center gap-1.5 mt-1.5",
              isOwn ? "justify-end" : "justify-start",
            )}
          >
            {showTimestamp && (
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isOwn
                    ? "text-primary-foreground/80"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                {formatMessageTime(message.created_at)}
                {message.is_edited && " (đã sửa)"}
              </span>
            )}

            {/* Status indicator for own messages */}
            {isOwn && (
              <span className="shrink-0">
                {status === "sending" && (
                  <Loader2
                    className={cn(
                      "h-3 w-3 animate-spin",
                      isOwn
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  />
                )}
                {status === "sent" && (
                  <Check
                    className={cn(
                      "h-3 w-3",
                      isOwn
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  />
                )}
                {status === "failed" && (
                  <AlertCircle className="h-3 w-3 text-destructive" />
                )}
              </span>
            )}
          </div>

          {/* Error message and retry button for failed messages */}
          {status === "failed" && isOptimistic && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-destructive/30">
              <span className="text-xs text-destructive flex-1">
                {message.error || "Gửi thất bại"}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={handleRetry}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Thử lại</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Context menu */}
        {canShowMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isOwn ? "end" : "start"}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {/* Reply button - always available */}
              <DropdownMenuItem onClick={() => onReply?.(message)}>
                <Reply className="h-4 w-4 mr-2" />
                Trả lời
              </DropdownMenuItem>

              {isOwn ? (
                <>
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowRecallDialog(true)}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Thu hồi
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={() => setShowReportDialog(true)}
                  className="text-red-500"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Báo cáo
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Spacer for own messages */}
        {isOwn && <div className="w-8 shrink-0" />}
      </motion.div>

      {/* Report Dialog */}
      {messageId && (
        <ReportDialog
          type="message"
          targetId={messageId}
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
        />
      )}

      {/* Recall Confirmation */}
      <AlertDialog
        open={showRecallDialog}
        onOpenChange={setShowRecallDialog}
        title="Thu hồi tin nhắn?"
        description="Tin nhắn này sẽ bị xóa và thay thế bằng thông báo đã thu hồi."
        onConfirm={handleRecall}
      />
    </>
  );
}

/**
 * Deleted message content with moderation reason tooltip
 */
function DeletedMessageContent({ messageId }: { messageId?: string }) {
  const { moderationAction } = useModerationReason(
    "message",
    messageId,
    true, // is_deleted
  );

  if (!messageId || !moderationAction) {
    return (
      <p className="text-sm italic text-muted-foreground">
        Tin nhắn đã thu hồi
      </p>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="text-sm italic text-muted-foreground flex items-center gap-1.5 cursor-help">
            <AlertTriangle className="h-3.5 w-3.5" />
            Tin nhắn đã thu hồi
          </p>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold text-xs mb-1">Lý do:</p>
          <p className="text-xs">{moderationAction.reason}</p>
          {moderationAction.matched_keyword && (
            <p className="text-xs mt-1 text-muted-foreground">
              Từ khóa: &quot;{moderationAction.matched_keyword}&quot;
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Date separator between messages
 */
export function MessageDateSeparator({ date }: { date: string }) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return "Hôm nay";
    if (isYesterday(d)) return "Hôm qua";
    return format(d, "EEEE, dd MMMM yyyy", { locale: vi });
  };

  return (
    <div className="flex items-center justify-center my-4">
      <span className="px-4 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 rounded-full shadow-sm">
        {formatDate(date)}
      </span>
    </div>
  );
}
