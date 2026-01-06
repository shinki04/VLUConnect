import { Input } from "@repo/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useDebounce } from "@uidotdev/usehooks";
import { AlertCircle, Loader2, Search } from "lucide-react";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import { useComments } from "@/hooks/usePostInteractions";
import { SortBy, useCommentStore } from "@/stores/commentStore";

import { Comment, CommentItem } from "./CommentItem";

interface CommentSectionProps {
  postId: string;
  isGlobalAdmin?: boolean;
}

/**
 * Virtualized comments section
 * Only root-level comments are virtualized, children are rendered normally within CommentItem
 * This preserves the expand/collapse UX while improving performance for long lists
 */
export function CommentSection({ postId, isGlobalAdmin = false }: CommentSectionProps) {
  const filters = useCommentStore((state) => state.getFilters(postId));
  const setSearch = useCommentStore((state) => state.setSearch);
  const setSortBy = useCommentStore((state) => state.setSortBy);
  const setReplyTo = useCommentStore((state) => state.setReplyTo);
  
  const debouncedSearch = useDebounce(filters.search, 500);

  const { 
      commentsData, 
      isLoading,
      error,
      removeComment, 
      editComment,
      toggleLike,
      fetchNextPage, 
      hasNextPage, 
      isFetchingNextPage 
  } = useComments(postId, debouncedSearch, filters.sortBy);
  
  const rawComments = React.useMemo(() => {
      const flat = commentsData?.pages.flatMap(page => page.comments) || [];
      return flat;
  }, [commentsData]);

  // Build tree structure for root comments only
  const commentTree = React.useMemo(() => {
    const map = new Map<string, Comment>();
    const roots: Comment[] = [];

    const nodes: Comment[] = rawComments.map(c => ({ 
        ...c, 
        children: [],
        is_edited: (c).is_edited ?? false 
    } as unknown as Comment));

    nodes.forEach(node => map.set(node.id, node));

    nodes.forEach(node => {
        if (node.parent_id && map.has(node.parent_id)) {
            map.get(node.parent_id)!.children!.push(node);
        } else {
            roots.push(node);
        }
    });

    // In search mode, show all matching comments flat
    return debouncedSearch ? nodes : roots;
  }, [rawComments, debouncedSearch]);
  
  const handleDelete = React.useCallback((commentId: string) => {
      removeComment(commentId); 
  }, [removeComment]);

  const handleReply = React.useCallback((authorName: string, parentId: string) => {
      setReplyTo(postId, { name: authorName, parentId });
  }, [postId, setReplyTo]);

  const handleEdit = React.useCallback((id: string, content: string) => {
      editComment({ commentId: id, content });
  }, [editComment]);

  const handleLike = React.useCallback((id: string, isLiked: boolean) => {
      toggleLike({ commentId: id, isLiked });
  }, [toggleLike]);

  // Handle infinite scroll
  const handleEndReached = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="space-y-4">
       {/* Controls */}
       <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
           <div className="relative w-full sm:w-[50%]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm bình luận..."
                    value={filters.search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(postId, e.target.value)}
                    className="pl-9 h-9"
                />
           </div>
           
           <div className="w-full sm:w-auto">
                <Select value={filters.sortBy} onValueChange={(v: SortBy) => setSortBy(postId, v)}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9">
                        <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Mới nhất</SelectItem>
                        <SelectItem value="top">Phổ biến nhất</SelectItem>
                        <SelectItem value="discussed">Nhiều phản hồi</SelectItem>
                    </SelectContent>
                </Select>
           </div>
       </div>

       <div>
           {isLoading && !rawComments.length && (
               <div className="flex justify-center p-4">
                   <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
               </div>
           )}
           
           {error && (
               <div className="py-8 text-center text-destructive">
                   <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                   <p className="font-medium">Không thể tải bình luận</p>
                   <p className="text-sm text-muted-foreground mt-1">
                       {error instanceof Error ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'}
                   </p>
               </div>
           )}

           {!isLoading && !error && rawComments.length === 0 && (
               <div className="py-8 text-center text-muted-foreground">
                   {debouncedSearch ? 
                    <p>Không tìm thấy bình luận nào.</p> : 
                    <p>Chưa có bình luận nào.</p>}
               </div>
           )}

           {/* Virtualized Root Comments - children rendered normally within each CommentItem */}
           {commentTree.length > 0 && (
             <Virtuoso
               useWindowScroll
               data={commentTree}
               endReached={handleEndReached}
               overscan={100}
               components={{
                 Footer: () =>
                   isFetchingNextPage ? (
                     <div className="flex justify-center pt-2 pb-4">
                       <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                     </div>
                   ) : null,
               }}
               itemContent={(_, comment) => (
                 <div className="py-2">
                   <CommentItem 
                     comment={comment} 
                     onReply={handleReply} 
                     onDelete={handleDelete}
                     onEdit={handleEdit}
                     onLike={handleLike}
                     isGlobalAdmin={isGlobalAdmin}
                   />
                 </div>
               )}
             />
           )}
       </div>
    </div>
  );
}
