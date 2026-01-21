import { getAllComments } from "@/app/actions/admin-comments";
import { CommentsDataTable } from "@/components/comments/CommentsDataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function CommentsManagePage() {
  // Fetch initial data on server
  const initialData = await getAllComments(1, 20);

  return (
    <PageHeader
      title="Danh sách bình luận"
      description="Xem và quản lý tất cả bình luận trên hệ thống"
      breadcrumbs={[
        { label: "Bảng điều khiển", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Quản lý bình luận", href: ADMIN_ROUTES.COMMENTS },
        { label: "Danh sách bình luận" },
      ]}
    >
      <CommentsDataTable initialData={initialData} />
    </PageHeader>
  );
}

