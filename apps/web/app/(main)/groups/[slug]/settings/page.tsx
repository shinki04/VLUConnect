import { notFound, redirect } from "next/navigation";

import { getGroup } from "@/app/actions/group";
import { GroupSettingsForm } from "@/components/groups/group-settings-form";

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;
  const group = await getGroup(slug);

  if (!group) {
    notFound();
  }

  // Only admin can access settings
  if (group.my_membership?.role !== "admin") {
    redirect(`/groups/${slug}`);
  }

  return (
    <div className="py-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Cài đặt Group</h2>
      <GroupSettingsForm group={group} />
    </div>
  );
}
