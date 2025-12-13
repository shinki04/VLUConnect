"use client";

import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";
import { Send } from "lucide-react";
import { KeyboardEvent,useEffect, useRef, useState } from "react";

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
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

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!content.trim() || disabled || isSending) return;

    const messageContent = content.trim();
    setContent(""); // Clear immediately for optimistic feel
    setIsSending(true);

    try {
      await onSend(messageContent);
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
  };

  const canSend = content.trim().length > 0 && !disabled && !isSending;

  return (
    <div className={cn("p-4 border-t bg-background/95 backdrop-blur", className)}>
      <div className="flex items-end gap-2">
        {/* Attachment button (future feature) */}
        {/* <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0 h-10 w-10"
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </Button> */}

        {/* Input */}
        <div className="flex-1 relative">
          <Textarea
          
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            // disabled={disabled || isSending}
            className={cn(
              "resize-none overflow-hidden min-h-[44px] max-h-[150px] pr-12 py-3",
              "rounded-2xl",
              "focus-visible:ring-1"
            )}
            rows={1}
          />

          {/* Emoji button (future feature) */}
          {/* <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-10 bottom-2 h-7 w-7"
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
          </Button> */}
        </div>

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          // disabled={!canSend}
          className={cn(
            "shrink-0 h-10 w-10 rounded-full transition-all duration-200",
            canSend
              ? "bg-primary hover:bg-primary/90 scale-100"
              : "bg-muted scale-90"
          )}
        >
         <Send className="h-5 w-5" />
          {/* {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )} */}
        </Button>
      </div>

      {/* Typing indicator hint */}
      <p className="text-[10px] text-muted-foreground mt-1 text-center">
        Nhấn Enter để gửi • Shift+Enter để xuống dòng
      </p>
    </div>
  );
}
