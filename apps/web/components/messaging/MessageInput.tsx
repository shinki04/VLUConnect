"use client";

import { Button } from "@repo/ui/components/button";
import SendIcon from "@repo/ui/components/send-icon";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import type { AnimatedIconHandle } from "@repo/ui/components/types";
import { cn } from "@repo/ui/lib/utils";
import { Paperclip, Reply, X } from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  SetStateAction,
  useCallback,
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
  onSend: (
    content: string, 
    replyTo?: { id: string; content: string | null; sender?: { display_name: string | null } },
    files?: File[]
  ) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  replyTo?: ReplyInfo | null;
  onCancelReply?: () => void;
}

/**
 * Message input with auto-resize, keyboard shortcuts, and file attachment
 * Enter sends, Shift+Enter adds newline
 * Supports drag-and-drop and click-to-attach files
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
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendIconRef = useRef<AnimatedIconHandle>(null);

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

  const handleSend = useCallback(
    async (filesToSend?: File[]) => {
      // Allow sending if there's content OR files
      if (
        (!content.trim() && (!filesToSend || filesToSend.length === 0)) ||
        disabled ||
        isSending
      )
        return;

      const messageContent = content.trim();
      // Capture reply info before clearing
      const replyInfo = replyTo
        ? {
            id: replyTo.id,
            content: replyTo.content,
            sender: { display_name: replyTo.senderName },
          }
        : undefined;

      // Clear immediately for optimistic feel
      setContent("");
      onCancelReply?.(); // Clear reply immediately when Enter is pressed
      setIsSending(true);

      try {
        await onSend(messageContent, replyInfo, filesToSend);
      } catch (error) {
        // Restore content if send failed
        setContent(messageContent);
        console.error("Failed to send message:", error);
      } finally {
        setIsSending(false);
        textareaRef.current?.focus();
      }
    },
    [content, disabled, isSending, replyTo, onCancelReply, onSend],
  );

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

  // File attachment handlers
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const fileArray = Array.from(files);
      handleSend(fileArray);
    },
    [handleSend],
  );

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if we're leaving the container, not entering a child
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const canSend = content.trim().length > 0 && !disabled && !isSending;

  return (
    <div
      className={cn("chat-input-container relative", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Paperclip className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium text-primary">
              Thả file vào đây để gửi
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z"
      />

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
        <div className="flex items-end gap-3 max-w-5xl mx-auto">
          {/* Attach button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0 h-9 w-9 rounded-full"
                onClick={handleAttachClick}
                disabled={disabled || isSending}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Đính kèm file (tối đa 2GB)</TooltipContent>
          </Tooltip>

          {/* Input */}
          <div className="flex-1 relative group">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e: { target: { value: SetStateAction<string> } }) =>
                setContent(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder={
                replyTo ? `Trả lời ${replyTo.senderName || ""}...` : placeholder
              }
              className={cn(
                "resize-none overflow-hidden min-h-[38px] max-h-[150px] py-2 px-4 text-[13px]",
                "bg-chat-bg border border-chat-border rounded-xl",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all shadow-sm",
              )}
              rows={1}
            />
          </div>

          {/* Send button */}
          <Button
            type="button"
            size="icon"
            onClick={() => handleSend()}
            onMouseEnter={() => sendIconRef.current?.startAnimation()}
            onMouseLeave={() => sendIconRef.current?.stopAnimation()}
            className={cn(
              "shrink-0 h-11 w-11 rounded-full transition-all duration-300 shadow-md",
              canSend
                ? "bg-primary hover:bg-primary/90 scale-100 shadow-primary/25 hover:shadow-lg hover:-translate-y-0.5"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 scale-95 cursor-not-allowed shadow-none",
            )}
          >
            {/* <Send className="h-5 w-5" /> */}
            <SendIcon ref={sendIconRef} className="h-5 w-5" size={26} />
          </Button>
        </div>

        {/* Typing indicator hint */}
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Nhấn Enter để gửi • Shift+Enter để xuống dòng
          {replyTo ? " • Esc để hủy trả lời" : ""} • Kéo thả file để gửi
        </p>
      </div>
    </div>
  );
}
