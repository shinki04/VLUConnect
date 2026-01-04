"use client";

import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";
import { Reply, Send, X } from "lucide-react";
import {
  KeyboardEvent,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

// Reply info for display
interface ReplyInfo {
  id: string;
  content: string | null;
  senderName: string | null;
}

interface MessageInputProps {
  onSend: (content: string, replyTo?: { id: string; content: string | null; sender?: { display_name: string | null } }) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  replyTo?: ReplyInfo | null;
  onCancelReply?: () => void;
}

/**
 * Message input with auto-resize and keyboard shortcuts
 * Enter sends, Shift+Enter adds newline
 */
export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Nhập tin nhắn...",
  className,
  replyTo,
  onCancelReply,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [content]);

  // Focus input when starting to reply (not on mount or clear)
  useEffect(() => {
    if (replyTo?.id) {
      // Use longer timeout to wait for dropdown menu to fully close
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [replyTo?.id]);

  const handleSend = async () => {
    if (!content.trim() || disabled || isSending) return;

    const messageContent = content.trim();
    // Capture reply info before clearing
    const replyInfo = replyTo ? { id: replyTo.id, content: replyTo.content, sender: { display_name: replyTo.senderName } } : undefined;
    
    // Clear immediately for optimistic feel
    setContent("");
    onCancelReply?.(); // Clear reply immediately when Enter is pressed
    setIsSending(true);

    try {
      await onSend(messageContent, replyInfo);
    } catch (error) {
      // Restore content if send failed
      setContent(messageContent);
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without shift sends message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Escape cancels reply
    if (e.key === "Escape" && replyTo) {
      onCancelReply?.();
    }
  };

  const canSend = content.trim().length > 0 && !disabled && !isSending;

  return (
    <div
      className={cn("border-t bg-background/95 backdrop-blur", className)}
    >
      {/* Reply banner */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b">
          <Reply className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              Đang trả lời {replyTo.senderName || "Người dùng"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {replyTo.content || "Tin nhắn"}
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-end gap-2">
          {/* Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e: { target: { value: SetStateAction<string> } }) =>
                setContent(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder={replyTo ? `Trả lời ${replyTo.senderName || ""}...` : placeholder}
              className={cn(
                "resize-none overflow-hidden min-h-11 max-h-[150px] pr-12 py-3",
                "rounded-2xl",
                "focus-visible:ring-1"
              )}
              rows={1}
            />
          </div>

          {/* Send button */}
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            className={cn(
              "shrink-0 h-10 w-10 rounded-full transition-all duration-200",
              canSend
                ? "bg-primary hover:bg-primary/90 scale-100"
                : "bg-muted scale-90"
            )}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Typing indicator hint */}
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Nhấn Enter để gửi • Shift+Enter để xuống dòng{replyTo ? " • Esc để hủy trả lời" : ""}
        </p>
      </div>
    </div>
  );
}

