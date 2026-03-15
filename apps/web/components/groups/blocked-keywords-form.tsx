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
import { AlertTriangle, ChevronLeft, ChevronRight,Plus, Trash2 } from "lucide-react";
import { useEffect,useState } from "react";
import { toast } from "sonner";

import {
  addGroupKeyword,
  type BlockedKeyword,
  deleteGroupKeyword,
  getGroupKeywords,
} from "@/app/actions/group-keywords";

interface BlockedKeywordsFormProps {
  groupId: string;
  canManage: boolean;
}

const ITEMS_PER_PAGE = 10;

export function BlockedKeywordsForm({ groupId, canManage }: BlockedKeywordsFormProps) {
  const [keywords, setKeywords] = useState<BlockedKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState("");
  const [matchType, setMatchType] = useState<"exact" | "partial">("partial");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination calculations
  const totalPages = Math.ceil(keywords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedKeywords = keywords.slice(startIndex, endIndex);

  useEffect(() => {
    loadKeywords();
  }, [groupId]);

  const loadKeywords = async () => {
    setIsLoading(true);
    try {
      const data = await getGroupKeywords(groupId);
      setKeywords(data);
    } catch (error) {
      console.error("Error loading keywords:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newKeyword.trim()) {
      toast.error("Vui lòng nhập từ khóa");
      return;
    }

    setIsAdding(true);
    try {
      const result = await addGroupKeyword(groupId, newKeyword, matchType);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã thêm từ khóa");
        setNewKeyword("");
        setCurrentPage(1);
        loadKeywords();
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (keywordId: string) => {
    if (!confirm("Bạn có chắc muốn xóa từ khóa này?")) return;

    setDeletingId(keywordId);
    try {
      const result = await deleteGroupKeyword(keywordId, groupId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa từ khóa");
        // Adjust page if needed
        const newTotalPages = Math.ceil((keywords.length - 1) / ITEMS_PER_PAGE);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
        loadKeywords();
      }
    } catch (error) {
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
    });
  };

  if (!canManage) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">
          Từ khóa bị cấm trong group này
        </span>
      </div>

      {/* Add new keyword form */}
      <div className="flex gap-2">
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
          <SelectTrigger className="w-25">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="partial">Chứa từ</SelectItem>
            <SelectItem value="exact">Chính xác</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} disabled={isAdding} size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Keywords table */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          Đang tải...
        </div>
      ) : keywords.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/30">
          Chưa có từ khóa nào bị chặn
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Từ khóa</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedKeywords.map((kw) => (
                  <TableRow key={kw.id}>
                    <TableCell className="font-medium">{kw.keyword}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          kw.match_type === "exact" ? "default" : "secondary"
                        }
                        className="text-xs"
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
                        className="hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, keywords.length)} /{" "}
              {keywords.length}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <span className="text-sm px-2">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Các bài đăng và bình luận chứa từ khóa bị cấm sẽ bị chặn tự động trong
        group này.
      </p>
    </div>
  );
}

