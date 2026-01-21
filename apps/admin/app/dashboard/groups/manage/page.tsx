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
      title="Danh sách nhóm"
      description="Xem và quản lý tất cả các nhóm trên nền tảng."
      breadcrumbs={[
        { label: "Bảng điều khiển", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Nhóm", href: ADMIN_ROUTES.GROUPS },
        { label: "Danh sách nhóm" },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhóm</CardTitle>
          <CardDescription>
            Danh sách tất cả các nhóm bao gồm trạng thái quyền riêng tư và số lượng thành viên.
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
