export const dynamic = "force-dynamic";
import { VerificationForm } from "@/components/setting/VerificationForm";

export default function VerificationPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-6 border-b border-dashboard-border">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Xác thực Giảng viên
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Xác thực danh tính Giảng viên để nhận được các đặc quyền và huy hiệu
          chính thức trên VLU Social.
        </p>
      </div>
      <div className="flex-1 w-full bg-dashboard-background/30 pb-10">
        <VerificationForm />
      </div>
    </div>
  );
}
