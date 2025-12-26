import { getGroup } from "@/app/actions/group";
import { createClient } from "@repo/supabase/server";
import { notFound } from "next/navigation";
import { GroupHeader } from "@/components/groups/group-header";

interface GroupLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function GroupLayout({ children, params }: GroupLayoutProps) {
  const { slug } = await params;
  const group = await getGroup(slug);

  if (!group) {
    notFound();
  }

  // Get current user for header actions
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background pb-10">
      <GroupHeader group={group} currentUser={user} />
      <div className="container max-w-5xl px-4 mx-auto">
        {children}
      </div>
    </div>
  );
}
