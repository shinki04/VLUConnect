"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
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
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { getAllUsers, updateUserRole } from "@/app/actions/admin-users";
import { useRefresh } from "@/components/common/RefreshContext";

interface User {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  global_role: string | null;
  create_at: string | null;
}

interface UsersDataTableProps {
  initialData?: {
    users: User[];
    totalPages: number;
    total: number;
  };
}

const ROLES = ["admin", "student", "lecturer", "moderator"] as const;

const roleBadgeVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  admin: "destructive",
  moderator: "default",
  lecturer: "secondary",
  student: "outline",
};

export function UsersDataTable({ initialData }: UsersDataTableProps) {
  const searchParams = useSearchParams();
  const [users, setUsers] = React.useState<User[]>(initialData?.users ?? []);
  const [loading, setLoading] = React.useState(!initialData);
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [role, setRole] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(
    initialData?.totalPages ?? 1,
  );
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const { refreshKey } = useRefresh();

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllUsers(page, 20, {
        search: search || undefined,
        role: role !== "all" ? role : undefined,
      });
      setUsers(result.users);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, role]);

  React.useEffect(() => {
    if (isInitialLoad && initialData && !searchParams.get("search")) {
      setIsInitialLoad(false);
      return;
    }

    if (isInitialLoad && searchParams.get("search")) {
      setIsInitialLoad(false);
    }

    const timer = setTimeout(
      () => {
        fetchUsers();
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [
    fetchUsers,
    search,
    role,
    refreshKey,
    isInitialLoad,
    initialData,
    searchParams,
  ]);

  const handleRoleChange = async (
    userId: string,
    newRole: (typeof ROLES)[number],
  ) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, global_role: newRole } : u)),
      );
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex w-full flex-col sm:flex-row gap-4 sm:max-w-2xl">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm người dùng..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={role}
            onValueChange={(value) => {
              setRole(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="lecturer">Giảng viên</SelectItem>
              <SelectItem value="student">Sinh viên</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người dùng</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Ngày tham gia</TableHead>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Không tìm thấy người dùng
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {(user.display_name ||
                            user.username ||
                            "U")[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.display_name || user.username || "Không rõ"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{user.username || "không rõ"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        roleBadgeVariants[user.global_role || ""] || "outline"
                      }
                    >
                      {user.global_role || "Chưa có vai trò"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.create_at
                      ? format(new Date(user.create_at), "dd/MM/yyyy")
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
                        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          Đổi vai trò
                        </DropdownMenuLabel>
                        {ROLES.map((role) => (
                          <DropdownMenuItem
                            key={role}
                            onClick={() => handleRoleChange(user.id, role)}
                            className={
                              user.global_role === role ? "bg-muted" : ""
                            }
                          >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </DropdownMenuItem>
                        ))}
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
        <p className="text-sm text-muted-foreground">
          Trang {page} / {totalPages}
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
