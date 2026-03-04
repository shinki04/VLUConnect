import { getGroup } from "@/app/actions/group";
import { Header } from "@/components/dashboard/Header";
interface GroupSlugProps {
  params: Promise<{ slug: string }>;
}
export default async function GroupsHeader({ params }: GroupSlugProps) {
  const { slug } = await params;
  const group = await getGroup(slug);
  return <Header title={group?.name || "Nhóm"} />;
}
