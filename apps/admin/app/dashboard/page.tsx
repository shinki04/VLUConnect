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
      title: "Total Users",
      value: stats.users.total,
      description: `+${stats.users.today} today`,
      icon: Users,
      trend: stats.users.today > 0 ? "up" : "neutral",
    },
    {
      title: "Total Posts",
      value: stats.posts.total,
      description: `+${stats.posts.today} today`,
      icon: FileText,
      trend: stats.posts.today > 0 ? "up" : "neutral",
    },
    {
      title: "Flagged Posts",
      value: stats.posts.flagged,
      description: "Needs review",
      icon: Flag,
      trend: stats.posts.flagged > 0 ? "warning" : "neutral",
    },
    {
      title: "Pending Reports",
      value: stats.reports.pending,
      description: "Awaiting action",
      icon: Flag,
      trend: stats.reports.pending > 0 ? "warning" : "neutral",
    },
  ];

  return (
    <PageHeader
      title="Dashboard Overview"
      description="Welcome to the admin panel. Here's an overview of your platform."
      breadcrumbs={[{ label: "Dashboard" }]}
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
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link
              href={ADMIN_ROUTES.POSTS_FLAGGED}
              className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <Flag className="h-4 w-4 text-orange-500" />
              <span>Review Flagged Posts ({stats.posts.flagged})</span>
            </Link>
            <Link
              href={ADMIN_ROUTES.REPORTS_MANAGE}
              className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <Flag className="h-4 w-4 text-red-500" />
              <span>Handle Reports ({stats.reports.pending})</span>
            </Link>
            <Link
              href={ADMIN_ROUTES.USERS_MANAGE}
              className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>Manage Users</span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Platform statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">New Users Today</p>
                  <p className="text-2xl font-bold text-green-500">
                    +{stats.users.today}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">New Posts Today</p>
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
