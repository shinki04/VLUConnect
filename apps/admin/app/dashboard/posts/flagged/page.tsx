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
      title="Flagged Posts"
      description="Review and moderate posts that have been flagged for content violations"
      breadcrumbs={[
        { label: "Dashboard", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Posts", href: ADMIN_ROUTES.POSTS },
        { label: "Flagged Posts" },
      ]}
      icon={<Flag className="h-6 w-6 text-orange-500" />}
    >
      <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
        <Flag className="h-5 w-5 text-orange-500 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-orange-700 dark:text-orange-400">Review Required</h4>
          <p className="text-sm text-orange-600 dark:text-orange-400">
            These posts have been flagged for manual review. Approve to unflag or delete if they violate policies.
          </p>
        </div>
      </div>

      <PostsDataTable flaggedOnly initialData={initialData} />
    </PageHeader>
  );
}
