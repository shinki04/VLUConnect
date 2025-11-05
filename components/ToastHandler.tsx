"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export function ToastHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("error");
    //   const error = searchParams.get("error") as ErrorMessageKey | null;

    const success = searchParams.get("success");

    if (error) {
      toast.error(error === "login" ? "Đăng nhập thất bại" : error);
    }

    if (success) {
      toast.success(
        success === "login" ? "Đăng nhập thành công! Chào mừng bạn!" : success
      );
    }

    // // Làm sạch URL để toast không lặp lại
    // if (error || success) {
    //   router.replace(window.location.pathname, { scroll: false });
    // }
  }, [searchParams, router]);

  return null; // Component này chỉ chạy logic, không render UI
}
