"use client";

import { Tables } from "@repo/shared/types/database.types";
import type { MessageWithSender, OptimisticMessage } from "@repo/shared/types/messaging";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import { AlertCircle, Check, Loader2, RotateCcw } from "lucide-react";

interface MessageBubbleProps {
  message: MessageWithSender | OptimisticMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onRetry?: (tempId: string) => void;
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
}: MessageBubbleProps) {
  const isOptimistic = "tempId" in message;
  const status = isOptimistic ? message.status : "sent";
  const sender = message.sender as Tables<"profiles"> | undefined;

  // Format time
  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);

    if (isToday(date)) {
      return format(date, "HH:mm");
    }
    if (isYesterday(date)) {
      return `Hôm qua ${format(date, "HH:mm")}`;
    }
    return format(date, "dd/MM HH:mm");
  };

  const handleRetry = () => {
    if (isOptimistic && message.tempId && onRetry) {
      onRetry(message.tempId);
    }
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 group",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwn ? (
        <Avatar className="h-8 w-8 shrink-0">
          {sender?.avatar_url ? (
            <AvatarImage src={sender.avatar_url} alt={sender.display_name || ""} />
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
          "max-w-[70%] rounded-2xl px-4 py-2 relative",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md",
          status === "failed" && "bg-destructive/10 border border-destructive/50",
          status === "sending" && "opacity-70"
        )}
      >
        {/* Sender name for group chats (if not own message) */}
        {!isOwn && sender && (
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            {sender.display_name || sender.username}
          </p>
        )}

        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Timestamp and status */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          {showTimestamp && (
            <span
              className={cn(
                "text-[10px]",
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
              {formatTime(message.created_at)}
            </span>
          )}

          {/* Status indicator for own messages */}
          {isOwn && (
            <span className="shrink-0">
              {status === "sending" && (
                <Loader2
                  className={cn(
                    "h-3 w-3 animate-spin",
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                />
              )}
              {status === "sent" && (
                <Check
                  className={cn(
                    "h-3 w-3",
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
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

      {/* Spacer for own messages */}
      {isOwn && <div className="w-8 shrink-0" />}
    </div>
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
      <span className="px-3 py-1 text-xs text-muted-foreground bg-muted rounded-full">
        {formatDate(date)}
      </span>
    </div>
  );
}
