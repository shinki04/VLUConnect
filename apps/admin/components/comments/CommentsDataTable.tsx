"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { ChevronLeft, ChevronRight, MoreHorizontal, Search, Trash2 } from "lucide-react";
import * as React from "react";

import { deleteCommentAdmin, getAllComments } from "@/app/actions/admin-comments";
import { useRefresh } from "@/components/common/RefreshContext";

interface Comment {
  id: string;
  content: string;
  created_at: string | null;
  author: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  post: {
    id: string;
    content: string;
  } | null;
}

interface CommentsDataTableProps {
  initialData?: {
    comments: Comment[];
    totalPages: number;
    total: number;
  };
}

export function CommentsDataTable({ initialData }: CommentsDataTableProps) {
  const [comments, setComments] = React.useState<Comment[]>(initialData?.comments ?? []);
  const [loading, setLoading] = React.useState(!initialData);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(initialData?.totalPages ?? 1);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const { refreshKey } = useRefresh();

  const fetchComments = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllComments(page, 20, { search: search || undefined });
      setComments(result.comments as Comment[]);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  React.useEffect(() => {
    if (isInitialLoad && initialData) {
      setIsInitialLoad(false);
      return;
    }
    
    const timer = setTimeout(() => {
      fetchComments();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchComments, search, refreshKey, isInitialLoad, initialData]);

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteCommentAdmin(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead className="min-w-[200px]">Comment</TableHead>
              <TableHead className="min-w-[150px]">On Post</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No comments found
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={comment.author?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {(comment.author?.display_name || "U")[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{comment.author?.display_name || "Unknown"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-2 text-sm">{comment.content}</p>
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {comment.post?.content?.slice(0, 50) || "Unknown post"}...
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDelete(comment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Comment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
