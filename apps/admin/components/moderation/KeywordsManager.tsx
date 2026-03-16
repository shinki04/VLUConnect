"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { ChevronLeft, ChevronRight,Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  addGlobalKeyword,
  type BlockedKeyword,
  deleteGlobalKeyword,
} from "@/app/actions/admin-keywords";

interface KeywordsManagerProps {
  initialKeywords: BlockedKeyword[];
}

const ITEMS_PER_PAGE = 10;

export function KeywordsManager({ initialKeywords }: KeywordsManagerProps) {
  const [keywords, setKeywords] = useState<BlockedKeyword[]>(initialKeywords);
  const [searchQuery, setSearchQuery] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [matchType, setMatchType] = useState<"exact" | "partial">("partial");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredKeywords = keywords.filter((kw) =>
    kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredKeywords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedKeywords = filteredKeywords.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleAdd = async () => {
    if (!newKeyword.trim()) {
      toast.error("Vui lòng nhập từ khóa");
      return;
    }

    setIsAdding(true);
    try {
      const result = await addGlobalKeyword(newKeyword, matchType);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã thêm từ khóa");
        setNewKeyword("");
        // Optimistic update
        setKeywords([
          {
            id: Date.now().toString(),
            keyword: newKeyword.toLowerCase().trim(),
            match_type: matchType,
            scope: "global",
            group_id: null,
            created_by: null,
            created_at: new Date().toISOString(),
          },
          ...keywords,
        ]);
        setCurrentPage(1); // Go to first page to see new item
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (keywordId: string) => {
    if (!confirm("Bạn có chắc muốn xóa từ khóa này?")) return;

    setDeletingId(keywordId);
    try {
      const result = await deleteGlobalKeyword(keywordId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa từ khóa");
        // Optimistic update
        const newKeywords = keywords.filter((kw) => kw.id !== keywordId);
        setKeywords(newKeywords);
        // Adjust current page if needed
        const newTotalPages = Math.ceil(
          newKeywords.filter((kw) =>
            kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())
          ).length / ITEMS_PER_PAGE
        );
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Add new keyword form */}
      <div className="flex md:gap-2 gap-1 p-4 bg-muted/50 rounded-lg">
        <Input
          placeholder="Nhập từ khóa cần chặn..."
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          className="flex-1 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Select
          value={matchType}
          onValueChange={(v) => setMatchType(v as "exact" | "partial")}
        >
          <SelectTrigger className="md:w-100 w-15">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem className="wrap-break-word" value="partial">
              Chứa từ (partial)
            </SelectItem>
            <SelectItem className="wrap-break-word" value="exact">
              Chính xác (exact)
            </SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          {isAdding ? "Đang thêm..." : "Thêm"}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm từ khóa..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Từ khóa</TableHead>
              <TableHead>Loại khớp</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-[100px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedKeywords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  {searchQuery
                    ? "Không tìm thấy từ khóa nào"
                    : "Chưa có từ khóa nào bị chặn"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedKeywords.map((kw) => (
                <TableRow key={kw.id}>
                  <TableCell className="font-medium">{kw.keyword}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        kw.match_type === "exact" ? "default" : "secondary"
                      }
                    >
                      {kw.match_type === "exact" ? "Chính xác" : "Chứa từ"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(kw.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(kw.id)}
                      disabled={deletingId === kw.id}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Hiển thị {filteredKeywords.length > 0 ? startIndex + 1 : 0}-
          {Math.min(endIndex, filteredKeywords.length)} của{" "}
          {filteredKeywords.length} từ khóa
          {searchQuery && ` (lọc từ ${keywords.length} tổng)`}
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Trước
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first, last, current, and adjacent pages
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, index, arr) => (
                  <span key={page} className="flex items-center">
                    {index > 0 && arr[index - 1] !== page - 1 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  </span>
                ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

