import { getAllPosts } from "@/app/actions/admin-posts";
import { PageHeader } from "@/components/common/PageHeader";
import { PostsDataTable } from "@/components/posts/PostsDataTable";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function AllPostsPage() {
  // Fetch initial data on server
  const initialData = await getAllPosts(1, 15);

  return (
    <PageHeader
      title="Tất cả bài đăng"
      description="Xem và quản lý tất cả bài đăng trên hệ thống"
      breadcrumbs={[
        { label: "Bảng điều khiển", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Quản lý bài đăng", href: ADMIN_ROUTES.POSTS },
        { label: "Tất cả bài đăng" },
      ]}
    >
      <PostsDataTable initialData={initialData} />
    </PageHeader>
  );
}

