import { getAllAnnouncements } from "@/app/actions/admin-announcements";
import { PageHeader } from "@/components/common/PageHeader";
import { AnnouncementsDataTable } from "@/components/notifications/AnnouncementsDataTable";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function NotificationsManagePage() {
  // Fetch initial data on server
  const initialData = await getAllAnnouncements(1, 20);

  // Map Supabase response to match Announcement interface
  const mappedData = {
    ...initialData,
    announcements: initialData.announcements.map((a) => ({
      ...a,
      is_active: a.is_active ?? false,
      created_at: a.created_at ?? "",
      created_by: a.created_by ?? "",
      creator: Array.isArray(a.creator)
        ? (a.creator[0] ?? null)
        : (a.creator ?? null),
    })),
  };

  return (
    <PageHeader
      title="Quản lý thông báo hệ thống"
      description="Quản lý các thông báo hiển thị trên toàn hệ thống cho người dùng"
      breadcrumbs={[
        { label: "Bảng điều khiển", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Quản lý thông báo" },
      ]}
    >
      <AnnouncementsDataTable initialData={mappedData} />
    </PageHeader>
  );
}
