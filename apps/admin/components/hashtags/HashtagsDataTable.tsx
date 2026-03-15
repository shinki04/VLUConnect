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

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";


const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

// Helper function to generate page numbers with ellipsis
function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("...");
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push("...");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("...");
    for (let i = current - 1; i <= current + 1; i++) pages.push(i);
    pages.push("...");
    pages.push(total);
  }
  return pages;
}

export function HashtagsDataTable({ initialData }: HashtagsDataTableProps) {
  const [hashtags, setHashtags] = React.useState<Hashtag[]>(initialData?.hashtags ?? []);
  const [loading, setLoading] = React.useState(!initialData);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [totalPages, setTotalPages] = React.useState(initialData?.totalPages ?? 1);
  const [_totalCount, _setTotalCount] = React.useState(initialData?.total ?? 0);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  const { refreshKey } = useRefresh();

  const fetchHashtags = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllHashtags(page, rowsPerPage, search || undefined);
      setHashtags(result.hashtags as Hashtag[]);
      setTotalPages(result.totalPages);
      if (result.total !== undefined) {
          _setTotalCount(result.total);
      }
    } catch (error) {
      console.error("Failed to fetch hashtags:", error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

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
    if (!confirm("Bạn có chắc chắn muốn xóa hashtag này? Điều này sẽ gỡ hashtag khỏi tất cả bài viết.")) return;
    try {
      await deleteHashtag(hashtagId);
      setHashtags((prev) => prev.filter((h) => h.id !== hashtagId));
    } catch (error) {
      console.error("Failed to delete hashtag:", error);
    }
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm hashtag..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* <Button variant="outline" size="sm" onClick={() => fetchHashtags()} title="Tải lại">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            <span className="ml-2 hidden sm:inline">Tải lại</span>
          </Button> */}
          <span className="text-sm text-muted-foreground whitespace-nowrap ml-2">
            Số dòng:
          </span>
          <Select
            value={String(rowsPerPage)}
            onValueChange={handleRowsPerPageChange}
          >
            <SelectTrigger className="w-[70px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hashtag</TableHead>
              <TableHead>Số bài viết</TableHead>
              <TableHead>Ngày tạo</TableHead>
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
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  Không tìm thấy hashtag
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
                    <span className="text-muted-foreground">
                      {hashtag.post_count} bài viết
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {hashtag.created_at
                      ? new Date(hashtag.created_at).toLocaleDateString()
                      : "-"}
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
                          Xóa hashtag
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          Trang {page} / {totalPages || 1}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page <= 1}
          >
            Đầu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {generatePageNumbers(page, totalPages).map((pageNum, idx) =>
            pageNum === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                className="w-9"
                onClick={() => setPage(pageNum as number)}
              >
                {pageNum}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
          >
            Cuối
          </Button>
        </div>
      </div>
    </div>
  );
}
