import { getAllReports } from "@/app/actions/admin-reports";
import { PageHeader } from "@/components/common/PageHeader";
import { ReportsDataTable } from "@/components/reports/ReportsDataTable";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function ReportsManagePage() {
  // Fetch initial data on server
  const initialData = await getAllReports(1, 20);

  return (
    <PageHeader
      title="Handle Reports"
      description="Review and take action on user reports"
      breadcrumbs={[
        { label: "Dashboard", href: ADMIN_ROUTES.DASHBOARD },
        { label: "Reports", href: ADMIN_ROUTES.REPORTS },
        { label: "Handle Reports" },
      ]}
    >
      <ReportsDataTable initialData={initialData} />
    </PageHeader>
  );
}
