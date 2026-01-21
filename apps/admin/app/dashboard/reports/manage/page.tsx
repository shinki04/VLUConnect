import { getAllReports } from "@/app/actions/admin-reports";
import { PageHeader } from "@/components/common/PageHeader";
import { ReportsDataTable } from "@/components/reports/ReportsDataTable";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function ReportsManagePage() {
  // Fetch initial data on server
  const initialData = await getAllReports(1, 20);

  return (
    <PageHeader
      title="Xử lý yêu cầu tố cáo"
      description="Xem xét và xử lý các yêu cầu tố cáo từ người dùng"
      breadcrumbs={[
        { label: "Bảng điều khiển", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Quản lý tố cáo", href: ADMIN_ROUTES.REPORTS },
        { label: "Xử lý yêu cầu tố cáo" },
      ]}
    >
      <ReportsDataTable initialData={initialData} />
    </PageHeader>
  );
}

