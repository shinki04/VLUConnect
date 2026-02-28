"use client";

import { SYSTEM_ANNOUNCEMENT_TYPES } from "@repo/shared/types/notification";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
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
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Edit2,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import * as React from "react";

import {
  createAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  updateAnnouncement,
} from "@/app/actions/admin-announcements";
import { useRefresh } from "@/components/common/RefreshContext";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
  creator?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface AnnouncementsDataTableProps {
  initialData?: {
    announcements: Announcement[];
    totalPages: number;
    total: number;
  };
}

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50] as const;

const typeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  info: "default",
  warning: "outline",
  success: "secondary",
  error: "destructive",
};

export function AnnouncementsDataTable({ initialData }: AnnouncementsDataTableProps) {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>(
    (initialData?.announcements as Announcement[]) ?? []
  );
  const [loading, setLoading] = React.useState(!initialData);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(initialData?.totalPages ?? 1);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Announcement | null>(null);
  
  const { refreshKey } = useRefresh();

  const fetchAnnouncements = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllAnnouncements(page, rowsPerPage);
      setAnnouncements(result.announcements as unknown as Announcement[]);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  React.useEffect(() => {
    if (isInitialLoad && initialData) {
      setIsInitialLoad(false);
      return;
    }
    fetchAnnouncements();
  }, [fetchAnnouncements, refreshKey, isInitialLoad, initialData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa thông báo này?")) return;
    try {
      await deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement", error);
    }
  };

  const openForm = (item?: Announcement) => {
    setEditingItem(item || null);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button onClick={() => openForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo thông báo mới
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Dòng:</span>
            <Select value={String(rowsPerPage)} onValueChange={(v) => { setRowsPerPage(Number(v)); setPage(1); }}>
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

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người tạo</TableHead>
                <TableHead className="w-[100px]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Không có thông báo nào
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.message}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeColors[item.type] || "default"}>{item.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      S: {format(new Date(item.start_time), "MMM d, HH:mm")} <br />
                      E: {item.end_time ? format(new Date(item.end_time), "MMM d, HH:mm") : "Không giới hạn"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Đang bật" : "Đã tắt"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={item.creator?.avatar_url || undefined} />
                          <AvatarFallback>
                            {(item.creator?.display_name || "U")[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{item.creator?.display_name || "Ẩn danh"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Tùy chọn</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openForm(item)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Xóa
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

        {/* Pagination Controls */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Trang {page} / {totalPages || 1}
          </span>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <AnnouncementFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingItem}
        onSuccess={() => {
          setIsDialogOpen(false);
          fetchAnnouncements();
        }}
      />
    </>
  );
}

function AnnouncementFormDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Announcement | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        title: formData.get("title") as string,
        message: formData.get("message") as string,
        type: formData.get("type") as string,
        start_time: new Date(formData.get("start_time") as string).toISOString(),
        end_time: formData.get("end_time")
          ? new Date(formData.get("end_time") as string).toISOString()
          : null,
        is_active: formData.get("is_active") === "true",
      };

      if (initialData) {
        await updateAnnouncement(initialData.id, data);
      } else {
        await createAnnouncement(data);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save announcement", error);
      alert("Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Sửa thông báo" : "Tạo thông báo mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề</Label>
            <Input
              id="title"
              name="title"
              defaultValue={initialData?.title}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Nội dung</Label>
            <Textarea
              id="message"
              name="message"
              defaultValue={initialData?.message}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Loại thông báo</Label>
              <Select name="type" defaultValue={initialData?.type || "info"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYSTEM_ANNOUNCEMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_active">Trạng thái (Bật/Tắt)</Label>
              <Select
                name="is_active"
                defaultValue={String(initialData?.is_active ?? true)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Đang bật</SelectItem>
                  <SelectItem value="false">Đã tắt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Thời gian bắt đầu</Label>
              <DateTimePicker
                name="start_time"
                defaultValue={initialData?.start_time}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Thời gian kết thúc (Tùy chọn)</Label>
              <DateTimePicker
                name="end_time"
                defaultValue={initialData?.end_time || ""}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu lại"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DateTimePicker({
  name,
  defaultValue,
  required,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [date, setDate] = React.useState<Date | undefined>(
    defaultValue ? new Date(defaultValue) : required ? new Date() : undefined,
  );
  const [time, setTime] = React.useState<string>(
    defaultValue ? format(new Date(defaultValue), "HH:mm") : "12:00",
  );

  const fullDate = React.useMemo(() => {
    if (!date) return undefined;
    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours || 0, minutes || 0, 0, 0);
    return newDate;
  }, [date, time]);

  return (
    <div>
      <input
        type="hidden"
        name={name}
        value={fullDate ? fullDate.toISOString() : ""}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {fullDate ? (
              format(fullDate, "MMM d, yyyy HH:mm")
            ) : (
              <span>Chọn ngày giờ</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Thời gian:</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-sm"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
