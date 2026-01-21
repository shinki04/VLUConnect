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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { ChevronLeft, ChevronRight, MoreHorizontal, Search } from "lucide-react";
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

const roleBadgeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  admin: "destructive",
  moderator: "default",
  lecturer: "secondary",
  student: "outline",
};

export function UsersDataTable({ initialData }: UsersDataTableProps) {
  const [users, setUsers] = React.useState<User[]>(initialData?.users ?? []);
  const [loading, setLoading] = React.useState(!initialData);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(initialData?.totalPages ?? 1);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const { refreshKey } = useRefresh();

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllUsers(page, 20, { search: search || undefined });
      setUsers(result.users);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to fetch users:", error);
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
      fetchUsers();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchUsers, search, refreshKey, isInitialLoad, initialData]);

  const handleRoleChange = async (userId: string, newRole: typeof ROLES[number]) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, global_role: newRole } : u))
      );
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
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
      </div>

      <div className="rounded-md border">
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
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
                          {(user.display_name || user.username || "U")[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.display_name || user.username || "Không rõ"}</p>
                        <p className="text-xs text-muted-foreground">@{user.username || "không rõ"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariants[user.global_role || ""] || "outline"}>
                      {user.global_role || "Chưa có vai trò"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.create_at ? new Date(user.create_at).toLocaleDateString() : "-"}
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
                            className={user.global_role === role ? "bg-muted" : ""}
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

      <div className="flex items-center justify-between">
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
