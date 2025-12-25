"use client";

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
import { ChevronLeft, ChevronRight, Hash, MoreHorizontal, Search, Trash2 } from "lucide-react";
import * as React from "react";

import { deleteHashtag, getAllHashtags } from "@/app/actions/admin-hashtags";
import { useRefresh } from "@/components/common/RefreshContext";

interface Hashtag {
  id: string;
  name: string;
  post_count: number | null;
  created_at: string | null;
}

interface HashtagsDataTableProps {
  initialData?: {
    hashtags: Hashtag[];
    totalPages: number;
    total: number;
  };
}

export function HashtagsDataTable({ initialData }: HashtagsDataTableProps) {
  const [hashtags, setHashtags] = React.useState<Hashtag[]>(initialData?.hashtags ?? []);
  const [loading, setLoading] = React.useState(!initialData);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(initialData?.totalPages ?? 1);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  const { refreshKey } = useRefresh();

  const fetchHashtags = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllHashtags(page, 20, search || undefined);
      setHashtags(result.hashtags as Hashtag[]);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to fetch hashtags:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  // Only fetch on client when: search changes, page changes, or refresh triggered
  // Skip initial fetch if we have initialData
  React.useEffect(() => {
    if (isInitialLoad && initialData) {
      setIsInitialLoad(false);
      return;
    }
    
    const timer = setTimeout(() => {
      fetchHashtags();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchHashtags, search, refreshKey, isInitialLoad, initialData]);

  const handleDelete = async (hashtagId: string) => {
    if (!confirm("Are you sure you want to delete this hashtag? This will remove it from all posts.")) return;
    try {
      await deleteHashtag(hashtagId);
      setHashtags((prev) => prev.filter((h) => h.id !== hashtagId));
    } catch (error) {
      console.error("Failed to delete hashtag:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search hashtags..."
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
              <TableHead>Hashtag</TableHead>
              <TableHead>Post Count</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : hashtags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No hashtags found
                </TableCell>
              </TableRow>
            ) : (
              hashtags.map((hashtag) => (
                <TableRow key={hashtag.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{hashtag.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{hashtag.post_count} posts</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {hashtag.created_at ? new Date(hashtag.created_at).toLocaleDateString() : "-"}
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
                          onClick={() => handleDelete(hashtag.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Hashtag
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
        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
