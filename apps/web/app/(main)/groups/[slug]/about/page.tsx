import { notFound } from "next/navigation";

import { getGroup } from "@/app/actions/group";

interface AboutPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { slug } = await params;
  const group = await getGroup(slug);

  if (!group) {
    notFound();
  }

  return (
    <div className="py-6">
      <div className="bg-card rounded-xl border p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Giới thiệu</h2>
          <p className="text-muted-foreground">
            {group.description || "Chưa có mô tả."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Quyền riêng tư</p>
            <p className="font-medium capitalize">
              {group.privacy_level === "private" ? "Riêng tư" : "Công khai"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Tham gia</p>
            <p className="font-medium">
              {group.membership_mode === "request"
                ? "Cần duyệt"
                : "Tự động"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Thành viên</p>
            <p className="font-medium">{group.members_count}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ngày tạo</p>
            <p className="font-medium">
              {group.created_at
                ? new Date(group.created_at).toLocaleDateString("vi-VN")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
