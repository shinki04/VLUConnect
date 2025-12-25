import { getAllPosts } from "@/app/actions/admin-posts";
import { PageHeader } from "@/components/common/PageHeader";
import { PostsDataTable } from "@/components/posts/PostsDataTable";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function AllPostsPage() {
  // Fetch initial data on server
  const initialData = await getAllPosts(1, 15);

  return (
    <PageHeader
      title="All Posts"
      description="View and manage all posts on the platform"
      breadcrumbs={[
        { label: "Dashboard", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Posts", href: ADMIN_ROUTES.POSTS },
        { label: "All Posts" },
      ]}
    >
      <PostsDataTable initialData={initialData} />
    </PageHeader>
  );
}
