import { getRedisClient } from "@repo/redis/redis";
import { createClient } from "@repo/supabase/server";
import { NextResponse } from "next/server";

const redis = getRedisClient();

const COOKIE_CONFIG = {
  path: "/",
  httpOnly: false,
  sameSite: "lax" as const,
  maxAge: 60,
};

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
    const { data: profile } = await supabase
      .from("profiles")
      .select()
      .eq("id", user.id)
      .maybeSingle();

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