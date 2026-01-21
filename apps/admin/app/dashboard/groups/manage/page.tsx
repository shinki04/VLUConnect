import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";

import { getGroups } from "@/app/actions/admin-groups";
import { PageHeader } from "@/components/common/PageHeader";
import { GroupsDataTable } from "@/components/groups/GroupsDataTable";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function GroupsManagePage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; privacy?: string };
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const privacy = params.privacy as "public" | "private" | undefined;

  const { groups, total, totalPages } = await getGroups(page, 10, {
    search,
    privacy,
  });

  return (
    <PageHeader
      title="Manage Groups"
      description="View and manage all groups on the platform."
      breadcrumbs={[
        { label: "Dashboard", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Groups", href: ADMIN_ROUTES.GROUPS },
        { label: "Manage Groups" },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Groups List</CardTitle>
          <CardDescription>
            A list of all groups including their privacy status and member counts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GroupsDataTable
            initialData={{
              groups: groups as { id: string; name: string; slug: string; privacy_level: string; members_count: number; created_at: string }[],
              totalPages,
              total,
            }}
          />
        </CardContent>
      </Card>
    </PageHeader>
  );
}
