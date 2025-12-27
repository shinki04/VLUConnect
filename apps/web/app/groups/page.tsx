import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupsList } from "@/components/groups/groups-list";

export default function GroupsPage() {
  return (
    <div className="container py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">
            Discover and join communities.
          </p>
        </div>
        <CreateGroupDialog />
      </div>

      <GroupsList />
    </div>
  );
}
