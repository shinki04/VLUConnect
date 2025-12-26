import { getGroup } from "@/app/actions/group";
import { notFound } from "next/navigation";
import { MemberList } from "@/components/groups/member-list";

interface MembersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { slug } = await params;
  const group = await getGroup(slug);

  if (!group) {
    notFound();
  }

  // Get current user's role in the group
  const currentUserRole = group.my_membership?.role || null;

  return (
    <div className="py-6">
      <MemberList groupId={group.id} currentUserRole={currentUserRole} />
    </div>
  );
}
