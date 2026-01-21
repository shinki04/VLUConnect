import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { FileText, Flag, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

import { getDashboardStats } from "@/app/actions/admin-stats";
import { PageHeader } from "@/components/common/PageHeader";
import { ADMIN_ROUTES } from "@/constants/admin-sidebar";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statsCards = [
    {
      title: "Tổng người dùng",
      value: stats.users.total,
      description: `+${stats.users.today} hôm nay`,
      icon: Users,
      trend: stats.users.today > 0 ? "up" : "neutral",
    },
    {
      title: "Tổng bài đăng",
      value: stats.posts.total,
      description: `+${stats.posts.today} hôm nay`,
      icon: FileText,
      trend: stats.posts.today > 0 ? "up" : "neutral",
    },
    {
      title: "Bài đăng bị gắn cờ",
      value: stats.posts.flagged,
      description: "Cần xem xét",
      icon: Flag,
      trend: stats.posts.flagged > 0 ? "warning" : "neutral",
    },
    {
      title: "Tố cáo đang chờ",
      value: stats.reports.pending,
      description: "Đang chờ xử lý",
      icon: Flag,
      trend: stats.reports.pending > 0 ? "warning" : "neutral",
    },
  ];

  return (
    <PageHeader
      title="Tổng quan"
      description="Chào mừng bạn đến trang quản trị. Đây là tổng quan hệ thống."
      breadcrumbs={[{ label: "Bảng điều khiển" }]}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon
                className={`h-4 w-4 ${
                  card.trend === "warning"
                    ? "text-orange-500"
                    : card.trend === "up"
                      ? "text-green-500"
                      : "text-muted-foreground"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.value.toLocaleString()}
              </div>
              <p
                className={`text-xs ${
                  card.trend === "warning"
                    ? "text-orange-500"
                    : card.trend === "up"
                      ? "text-green-500"
                      : "text-muted-foreground"
                }`}
              >
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Các tác vụ quản trị thường dùng</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link
              href={ADMIN_ROUTES.POSTS_FLAGGED}
              className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <Flag className="h-4 w-4 text-orange-500" />
              <span>Xem bài đăng bị gắn cờ ({stats.posts.flagged})</span>
            </Link>
            <Link
              href={ADMIN_ROUTES.REPORTS_MANAGE}
              className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <Flag className="h-4 w-4 text-red-500" />
              <span>Xử lý tố cáo ({stats.reports.pending})</span>
            </Link>
            <Link
              href={ADMIN_ROUTES.USERS_MANAGE}
              className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>Quản lý người dùng</span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Thống kê hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">Người dùng mới hôm nay</p>
                  <p className="text-2xl font-bold text-green-500">
                    +{stats.users.today}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">Bài đăng mới hôm nay</p>
                  <p className="text-2xl font-bold text-blue-500">
                    +{stats.posts.today}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageHeader>
  );
}

