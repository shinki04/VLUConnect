"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import Cookies from "js-cookie";
export function useToastFromCookie() {
  //   const allCookies = document.cookie;
  //   console.log("All client-side cookies:", allCookies);
  useEffect(() => {
    const errorMessage = Cookies.get("access_error");
    const successMessage = Cookies.get("success");
    if (errorMessage) {
      toast.error(errorMessage);
      Cookies.remove("access_error");
    }
    if (successMessage) {
      toast.success(successMessage);
      Cookies.remove("success");
    }
  }, []);
}
