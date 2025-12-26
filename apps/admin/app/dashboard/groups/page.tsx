import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { GroupsDataTable } from "@/components/groups/GroupsDataTable";
import { getGroups } from "@/app/actions/admin-groups";

export default async function GroupsPage({
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
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Groups</h2>
          <p className="text-muted-foreground">
            Manage all groups on the platform.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Groups List</CardTitle>
          <CardDescription>
            A list of all groups including their privacy status and member counts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GroupsDataTable
            data={groups}
            page={page}
            totalPages={totalPages}
            total={total}
            search={search}
          />
        </CardContent>
      </Card>
    </div>
  );
}
