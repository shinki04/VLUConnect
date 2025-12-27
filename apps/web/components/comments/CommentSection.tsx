import { Input } from "@repo/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useDebounce } from "@uidotdev/usehooks";
import { Loader2, Search } from "lucide-react";
import React from "react";
import { useInView } from "react-intersection-observer";

import { useComments } from "@/hooks/usePostInteractions";
import { SortBy, useCommentStore } from "@/stores/commentStore";

import { Comment, CommentItem } from "./CommentItem";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const filters = useCommentStore((state) => state.getFilters(postId));
  const setSearch = useCommentStore((state) => state.setSearch);
  const setSortBy = useCommentStore((state) => state.setSortBy);
  const setReplyTo = useCommentStore((state) => state.setReplyTo);
  
  const debouncedSearch = useDebounce(filters.search, 500);

  const { 
      commentsData, 
      isLoading, 
      removeComment, 
      editComment,
      toggleLike,
      fetchNextPage, 
      hasNextPage, 
      isFetchingNextPage 
  } = useComments(postId, debouncedSearch, filters.sortBy);

  const { ref, inView } = useInView();

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  const rawComments = React.useMemo(() => {
      const flat = commentsData?.pages.flatMap(page => page.comments) || [];
      return flat;
  }, [commentsData]);

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
            if (debouncedSearch) {
                roots.push(node);
            } else {
                if (!node.parent_id) roots.push(node);
            }
        }
    });

    return debouncedSearch ? nodes : roots;
  }, [rawComments, debouncedSearch]);
  
  const handleDelete = (commentId: string) => {
      removeComment(commentId); 
  };

  const handleReply = (authorName: string, parentId: string) => {
      setReplyTo(postId, { name: authorName, parentId });
  };

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

       <div className="space-y-4">
           {isLoading && !rawComments.length && (
               <div className="flex justify-center p-4">
                   <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
               </div>
           )}
           
           {!isLoading && rawComments.length === 0 && (
               <div className="py-8 text-center text-muted-foreground">
                   {debouncedSearch ? 
                    <p>Không tìm thấy bình luận nào.</p> : 
                    <p>Chưa có bình luận nào.</p>}
               </div>
           )}

           {/* Comments List */}
           {commentTree.map((comment) => (
               <CommentItem 
                 key={comment.id} 
                 comment={comment} 
                 onReply={handleReply} 
                 onDelete={handleDelete}
                 onEdit={(id, content) => editComment({ commentId: id, content })}
                 onLike={(id, isLiked) => toggleLike({ commentId: id, isLiked })}
               />
           ))}

           {/* Load More at Bottom */}
           {hasNextPage && (
               <div ref={ref} className="flex justify-center pt-2 pb-4">
                   <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
               </div>
           )}
       </div>
    </div>
  );
}
