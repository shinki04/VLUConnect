import { getAllComments } from "@/app/actions/admin-comments";
import { CommentsDataTable } from "@/components/comments/CommentsDataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function CommentsManagePage() {
  // Fetch initial data on server
  const initialData = await getAllComments(1, 20);

  return (
    <PageHeader
      title="Manage Comments"
      description="View and moderate all comments on the platform"
      breadcrumbs={[
        { label: "Dashboard", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Comments", href: ADMIN_ROUTES.COMMENTS },
        { label: "Manage Comments" },
      ]}
    >
      <CommentsDataTable initialData={initialData} />
    </PageHeader>
  );
}
