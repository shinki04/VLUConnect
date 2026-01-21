import { getAllHashtags } from "@/app/actions/admin-hashtags";
import { PageHeader } from "@/components/common/PageHeader";
import { HashtagsDataTable } from "@/components/hashtags/HashtagsDataTable";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function HashtagsManagePage() {
  // Fetch initial data on server
  const initialData = await getAllHashtags(1, 20);

  return (
    <PageHeader
      title="Danh sách hashtag"
      description="Xem và quản lý tất cả hashtags"
      breadcrumbs={[
        { label: "Bảng điều khiển", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Quản lý hashtags", href: ADMIN_ROUTES.HASHTAGS },
        { label: "Danh sách hashtag" },
      ]}
    >
      <HashtagsDataTable initialData={initialData} />
    </PageHeader>
  );
}

