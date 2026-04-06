import { getRedisClient } from "@repo/redis/redis";
import { createClient } from "@repo/supabase/server";
import { createServiceClient } from "@repo/supabase/service";
import { NextResponse } from "next/server";

const redis = getRedisClient();

const COOKIE_CONFIG = {
  path: "/",
  httpOnly: false,
  sameSite: "lax" as const,
  maxAge: 60,
};

const VLU_EMAIL_DOMAINS = ["@vanlanguni.vn", "@vlu.edu.vn"];
const USER_CACHE_TTL = 3600;



const redirectWithCookie = (url: string, name: string, value: string) => {
  const res = NextResponse.redirect(url);
  res.cookies.set(name, value, COOKIE_CONFIG);
  return res;
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return redirectWithCookie(`${origin}/login`, "access_error", "Thiếu mã đăng nhập");
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data?.user) {
      return redirectWithCookie(`${origin}/login`, "access_error", "Không thể đăng nhập");
    }

    const user = data.user;

    if (!VLU_EMAIL_DOMAINS.some(domain => user.email?.endsWith(domain))) {
      const serviceClient = createServiceClient();
      serviceClient.auth.admin.deleteUser(user.id).catch(console.error);
      await supabase.auth.signOut();

      return redirectWithCookie(
        `${origin}/login`,
        "access_error",
        "KHÔNG THUỘC VLU" // Adjusting error text to match admin style
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select()
      .eq("id", user.id)
      .maybeSingle();

    if (profile && profile.global_role === null) {
      const newRole = user.email?.endsWith("@vlu.edu.vn") ? "lecturer" : "student";
      const serviceClient = createServiceClient();
      await serviceClient
        .from("profiles")
        .update({ global_role: newRole })
        .eq("id", user.id);
      
      profile.global_role = newRole;
    }

    // cache redis
    if (profile) {
      try {
        await redis.setCache(`user:${user.id}`, profile, USER_CACHE_TTL);
      } catch (err) {
        console.error("Redis error:", err);
      }
    }

    return redirectWithCookie(`${origin}/dashboard`, "success", "Đăng nhập thành công");
  } catch (err) {
    console.error(err);

    return redirectWithCookie(`${origin}/login`, "access_error", "Lỗi hệ thống");
  }
}