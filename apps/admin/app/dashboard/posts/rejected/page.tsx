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
      title="Rejected Posts"
      description="Posts that have been rejected and hidden from public view"
      breadcrumbs={[
        { label: "Dashboard", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Posts", href: ADMIN_ROUTES.POSTS_ALL },
        { label: "Rejected Posts" },
      ]}
      icon={
        <div className="rounded-lg bg-destructive/10 p-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
      }
    >
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive dark:text-red-400">
        <strong>Note:</strong> These posts have been rejected by moderators. 
        They are hidden from the public but can be restored if needed.
      </div>

      <PostsDataTable rejectedOnly initialData={initialData} />
    </PageHeader>
  );
}
