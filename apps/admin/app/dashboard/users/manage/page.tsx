import { getAllUsers } from "@/app/actions/admin-users";
import { PageHeader } from "@/components/common/PageHeader";
import { UsersDataTable } from "@/components/users/UsersDataTable";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function UsersManagePage() {
  // Fetch initial data on server
  const initialData = await getAllUsers(1, 20);

  return (
    <PageHeader
      title="Manage Users"
      description="View and manage all registered users"
      breadcrumbs={[
        { label: "Dashboard", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Users", href: ADMIN_ROUTES.USERS },
        { label: "Manage Users" },
      ]}
    >
      <UsersDataTable initialData={initialData} />
    </PageHeader>
  );
}
