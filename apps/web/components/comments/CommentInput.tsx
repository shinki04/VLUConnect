"use client";

import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea"; 
import { useDebounce } from "@uidotdev/usehooks";
import { Loader2, SendHorizontal } from "lucide-react";
import React, { useRef, useState } from "react";

import { useComments } from "@/hooks/usePostInteractions";
import { useCommentStore } from "@/stores/commentStore";

interface CommentInputProps {
  postId: string;
}

export function CommentInput({ postId }: CommentInputProps) {
  const replyTo = useCommentStore((state) => state.replyTargets[postId]);
  const clearReplyTo = useCommentStore((state) => state.clearReplyTo);
  const filters = useCommentStore((state) => state.getFilters(postId));
  
  // Use the same filters as CommentSection to ensure same query key
  const debouncedSearch = useDebounce(filters.search, 500);
  const { sendComment, isSending } = useComments(postId, debouncedSearch, filters.sortBy);
  
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when replyTo changes
  React.useEffect(() => {
      if (replyTo && inputRef.current) {
          inputRef.current.focus();
      }
  }, [replyTo]);

  const handleSend = () => {
      if (!content.trim()) return;
      
      const currentContent = content;
      
      // Clear immediately
      setContent("");
      clearReplyTo(postId);
      
      sendComment({ content: currentContent, parentId: replyTo?.parentId }, {
          onSuccess: () => {},
          onError: () => {
              setContent(currentContent);
          }
      });
  };

  return (
       <div className="bg-background pt-2 pb-2 border-t px-4">
           {replyTo && (
               <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 bg-muted/50 p-2 rounded">
                   <span>Đang trả lời <b>{replyTo.name}</b></span>
                   <button onClick={() => clearReplyTo(postId)} className="hover:text-red-500 font-medium">Hủy</button>
               </div>
           )}
           <div className="flex gap-2 items-end">
               <Textarea 
                 ref={inputRef}
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
                 placeholder={replyTo ? `Trả lời ${replyTo.name}...` : "Viết bình luận..."}
                 className="min-h-[40px] max-h-[120px] resize-none py-2 bg-muted/30 focus:bg-background transition-colors"
                 onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handleSend();
                     }
                 }}
               />
               <Button 
                 size="icon" 
                 onClick={handleSend} 
                 disabled={isSending || !content.trim()}
                 className="mb-[2px] shrink-0"
               >
                   {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
               </Button>
           </div>
       </div>
  );
}
