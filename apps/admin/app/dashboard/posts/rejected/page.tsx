import { AlertTriangle } from "lucide-react";

import { getAllPosts } from "@/app/actions/admin-posts";
import { PageHeader } from "@/components/common/PageHeader";
import { PostsDataTable } from "@/components/posts/PostsDataTable";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function RejectedPostsPage() {
  // Fetch initial rejected posts on server
  const initialData = await getAllPosts(1, 15, { moderationStatus: "rejected" });

  return (
    <PageHeader
      title="Bài đăng bị từ chối"
      description="Các bài đăng đã bị từ chối và ẩn khỏi công khai"
      breadcrumbs={[
        { label: "Bảng điều khiển", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Quản lý bài đăng", href: ADMIN_ROUTES.POSTS_ALL },
        { label: "Bài đăng bị từ chối" },
      ]}
      icon={
        <div className="rounded-lg bg-destructive/10 p-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
      }
    >
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive dark:text-red-400">
        <strong>Lưu ý:</strong> Các bài đăng này đã bị từ chối bởi kiểm duyệt viên. 
        Chúng đã bị ẩn khỏi công khai nhưng có thể khôi phục nếu cần.
      </div>

      <PostsDataTable rejectedOnly initialData={initialData} />
    </PageHeader>
  );
}

