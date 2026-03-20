"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import * as React from "react";

interface Post {
  id: string;
  content: string | null;
  created_at: string | null;
  author: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface HashtagPostsTableProps {
  posts: Post[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  selectedHashtagName?: string;
}

export function HashtagPostsTable({
  posts,
  loading,
  page,
  totalPages,
  total,
  onPageChange,
  selectedHashtagName,
}: HashtagPostsTableProps) {
  const truncateContent = (content: string | null, maxLength: number = 80) => {
    if (!content) return "-";
    return content.length > maxLength ? content.slice(0, maxLength) + "..." : content;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Bài viết{" "}
          {selectedHashtagName ? `sử dụng #${selectedHashtagName}` : ""}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({total} tổng)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tác giả</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy bài viết
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={post.author?.avatar_url ?? undefined}
                          />
                          <AvatarFallback>
                            {post.author?.display_name?.[0] ||
                              post.author?.username?.[0] ||
                              "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {post.author?.display_name ||
                            post.author?.username ||
                            "Không xác định"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm text-muted-foreground truncate">
                        {truncateContent(post.content)}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {post.created_at
                        ? new Date(post.created_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/dashboard/posts/all?search=${post.id}`}
                          target="_blank"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
