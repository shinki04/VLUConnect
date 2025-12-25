import { getAllHashtags } from "@/app/actions/admin-hashtags";
import { PageHeader } from "@/components/common/PageHeader";
import { HashtagsDataTable } from "@/components/hashtags/HashtagsDataTable";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function HashtagsManagePage() {
  // Fetch initial data on server
  const initialData = await getAllHashtags(1, 20);

  return (
    <PageHeader
      title="Manage Hashtags"
      description="View and manage all hashtags"
      breadcrumbs={[
        { label: "Dashboard", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Hashtags", href: ADMIN_ROUTES.HASHTAGS },
        { label: "Manage Hashtags" },
      ]}
    >
      <HashtagsDataTable initialData={initialData} />
    </PageHeader>
  );
}
