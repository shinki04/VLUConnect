import { Flag } from "lucide-react";

import { getAllPosts } from "@/app/actions/admin-posts";
import { PageHeader } from "@/components/common/PageHeader";
import { PostsDataTable } from "@/components/posts/PostsDataTable";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function FlaggedPostsPage() {
  // Fetch initial flagged posts on server
  const initialData = await getAllPosts(1, 15, { moderationStatus: "flagged" });

  return (
    <PageHeader
      title="Bài viết bị đánh dấu Flag"
      description="Xem xét và kiểm duyệt các bài đăng đã bị gắn cờ vi phạm nội dung"
      breadcrumbs={[
        { label: "Bảng điều khiển", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Quản lý bài đăng", href: ADMIN_ROUTES.POSTS },
        { label: "Bài viết bị đánh dấu Flag" },
      ]}
      icon={<Flag className="h-6 w-6 text-orange-500" />}
    >
      <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
        <Flag className="h-5 w-5 text-orange-500 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-orange-700 dark:text-orange-400">Cần xem xét</h4>
          <p className="text-sm text-orange-600 dark:text-orange-400">
            Các bài đăng này đã bị gắn cờ cần xem xét thủ công. Phê duyệt để bỏ cờ hoặc xóa nếu vi phạm chính sách.
          </p>
        </div>
      </div>

      <PostsDataTable flaggedOnly initialData={initialData} />
    </PageHeader>
  );
}

