import { notFound, redirect } from "next/navigation";

import { getGroup } from "@/app/actions/group";
import { GroupManageTabs } from "@/components/groups/group-manage-tabs";

interface ManagePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ManagePage({ params, searchParams }: ManagePageProps) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const group = await getGroup(slug);

  if (!group) {
    notFound();
  }

  // Only admin, sub_admin, or moderator can access manage page
  const canManage = ["admin", "sub_admin", "moderator"].includes(
    group.my_membership?.role ?? ""
  );
  
  if (!canManage) {
    redirect(`/groups/${slug}`);
  }

  const isAdmin = group.my_membership?.role === "admin";

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6">Quản lý Group</h2>
      <GroupManageTabs 
        group={group} 
        isAdmin={isAdmin} 
        canManage={canManage}
        defaultTab={tab || "members"}
      />
    </div>
  );
}
