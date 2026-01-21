import { getAllUsers } from "@/app/actions/admin-users";
import { PageHeader } from "@/components/common/PageHeader";
import { UsersDataTable } from "@/components/users/UsersDataTable";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function UsersManagePage() {
  // Fetch initial data on server
  const initialData = await getAllUsers(1, 20);

  return (
    <PageHeader
      title="Danh sách người dùng"
      description="Xem và quản lý tất cả người dùng đã đăng ký"
      breadcrumbs={[
        { label: "Bảng điều khiển", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Người dùng", href: ADMIN_ROUTES.USERS },
        { label: "Danh sách người dùng" },
      ]}
    >
      <UsersDataTable initialData={initialData} />
    </PageHeader>
  );
}
