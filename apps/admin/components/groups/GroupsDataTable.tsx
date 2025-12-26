"use client";

import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/table";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";

import { MoreHorizontal, Lock, Globe, Trash } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { deleteGroup } from "@/app/actions/admin-groups";
import AlertDialog  from "@repo/ui/components/AlertDialog";

interface Group {
    id: string;
    name: string;
    slug: string;
    privacy_level: string;
    members_count: number;
    created_at: string;
}

interface GroupsDataTableProps {
  data: Group[];
  page: number;
  totalPages: number;
  total: number;
    search: string;
}

export function GroupsDataTable({ data, page, totalPages, total, search }: GroupsDataTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState(search);
    const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: ColumnDef<Group>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "slug",
      header: "Slug",
        cell: ({ row }) => <div className="text-muted-foreground text-sm">/{row.getValue("slug")}</div>
    },
    {
      accessorKey: "privacy_level",
      header: "Privacy",
      cell: ({ row }) => {
          const isPrivate = row.getValue("privacy_level") === "private";
          return (
              <div className="flex items-center gap-2">
                  {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                  <span className="capitalize">{row.getValue("privacy_level")}</span>
              </div>
          )
      }
    },
    {
      accessorKey: "members_count",
      header: "Members",
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => format(new Date(row.getValue("created_at")), "MMM d, yyyy"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const group = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setDeleteId(group.id)} className="text-red-600 cursor-pointer">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

   const handleSearch = (term: string) => {
        setSearchTerm(term);
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(newPage));
        router.push(`${pathname}?${params.toString()}`);
    };
    
    const confirmDelete = () => {
        if (!deleteId) return;
        startTransition(async () => {
            const result = await deleteGroup(deleteId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Group deleted successfully");
                setDeleteId(null);
            }
        });
    }

  return (
    <div className="space-y-4">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter groups..."
          value={searchTerm}
          onChange={(event) => handleSearch(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className="text-sm">
             Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
      
       <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete the group and remove all data associated with it."
        onConfirm={confirmDelete}
        confirmText={isPending ? "Deleting..." : "Delete"}
        
      />
    </div>
  );
}
