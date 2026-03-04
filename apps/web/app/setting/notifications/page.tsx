import { NotificationList } from "@/components/setting/NotificationList";

export default function NotificationsPage() {
  return (
    <div className="w-full h-full flex flex-col">
      {/* <div className="p-6 border-b border-dashboard-border">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thông báo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Xem lại tất cả hoạt động và tương tác từ cộng đồng dành cho bạn.
        </p>
      </div> */}
      <div className="flex-1 w-full pb-10">
        <NotificationList />
      </div>
    </div>
  );
}
