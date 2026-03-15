import { getGlobalKeywords } from "@/app/actions/admin-keywords";
import { PageHeader } from "@/components/common/PageHeader";
import { KeywordsManager } from "@/components/moderation/KeywordsManager";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";

export const metadata = {
  title: "Quản lý từ cấm | Admin",
  description: "Quản lý từ khóa bị cấm toàn hệ thống",
};

export default async function KeywordsPage() {
  const keywords = await getGlobalKeywords();

  return (
    <PageHeader
      title="Quản lý từ khóa"
      description="Các từ khóa bị chặn toàn hệ thống. Bài đăng và bình luận chứa các từ
          này sẽ bị chặn tự động."
      breadcrumbs={[
        { label: "Bảng điều khiển", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Kiểm duyệt", href: ADMIN_ROUTES.MODERATION },
        { label: "Danh sách từ khóa" },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Quản lý từ khóa</CardTitle>
          <CardDescription>
            Các từ khóa bị chặn toàn hệ thống. Bài đăng và bình luận chứa các từ
            này sẽ bị chặn tự động.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KeywordsManager initialKeywords={keywords} />
        </CardContent>
      </Card>
    </PageHeader>
  );
}
