import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/lib/supabase/server";
import { Global_Roles } from "@/types/user";

const redirectWithCookie = (url: string, name: string, value: string) => {
  const res = NextResponse.redirect(url);
  res.cookies.set(name, value, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 10,
  });
  return res;
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/dashboard";

  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    const user = data?.user;

    if (!user) {
      console.error("Something was wrong - User not found");
      const res = NextResponse.redirect(`${origin}/login`);
      res.cookies.set("access_error", "Không tìm thấy người dùng", {
        path: "/",
        httpOnly: false, // client đọc được
        sameSite: "lax",
        maxAge: 10, // 10 giây là đủ
      });
      return res;
    }

    if (!user?.email?.endsWith("@vanlanguni.vn")) {
      console.warn("Khong phai VLU");
      // Xoá user ngay sau khi tạo
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      console.warn("Deleted non-vanlang user:", error);

      const res = NextResponse.redirect(`${origin}/login`);
      res.cookies.set("access_error", "Không thuộc VLU", {
        path: "/",
        httpOnly: false, // client đọc được
        sameSite: "lax",
        maxAge: 10, // 10 giây là đủ
      });
      return res;
    }

    // ---- Xử lý sau khi login thành công ----

    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      `User ${user.id}`;
    const avatarUrl = user.user_metadata?.avatar_url ?? null;

    const defaultRole: Global_Roles = "student";

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      username: fullName,
      avatar_url: avatarUrl,
      email: user.email,
      global_role: defaultRole,
    });

    if (!error && !upsertError) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return redirectWithCookie(
          `${origin}${next}`,
          "success",
          "Đăng nhập thành công"
        );
      } else if (forwardedHost) {
        return redirectWithCookie(
          `https://${forwardedHost}${next}`,
          "success",
          "Đăng nhập thành công"
        );
      } else {
        return redirectWithCookie(
          `${origin}${next}`,
          "success",
          "Đăng nhập thành công"
        );
      }
    } else {
      console.error(error, upsertError);
    }
  }

  // return the user to an error page with instructions
  return redirectWithCookie(`${origin}/login`, "access_error", "Có lỗi xảy ra");
}
