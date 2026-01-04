import { getRedisClient } from "@repo/redis/redis";
import { createClient } from "@repo/supabase/server";
import { NextResponse } from "next/server";

const COOKIE_CONFIG = {
  path: "/",
  httpOnly: false,
  sameSite: "lax" as const,
  maxAge: 10,
};

const VLU_EMAIL_DOMAIN = "@vanlanguni.vn";
const USER_CACHE_TTL = 3600;

const redis = getRedisClient();

const redirectWithCookie = (url: string, name: string, value: string) => {
  const res = NextResponse.redirect(url);
  res.cookies.set(name, value, COOKIE_CONFIG);
  return res;
};

const getRedirectUrl = (
  origin: string,
  next: string,
  request: Request
): string => {
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return `${origin}${next}`;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  return forwardedHost ? `https://${forwardedHost}${next}` : `${origin}${next}`;
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  let next = searchParams.get("next") ?? "/dashboard";
  if (!next.startsWith("/")) next = "/dashboard";

  if (!code) {
    return redirectWithCookie(
      `${origin}/login`,
      "access_error",
      "Có lỗi xảy ra"
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data?.user) {
      return redirectWithCookie(
        `${origin}/login`,
        "access_error",
        "Không tìm thấy người dùng"
      );
    }

    const user = data.user;

    if (!user.email?.endsWith(VLU_EMAIL_DOMAIN)) {
      supabase.auth.admin.deleteUser(user.id).catch(console.error);

      return redirectWithCookie(
        `${origin}/login`,
        "access_error",
        "Không thuộc VLU"
      );
    }

    const { data: profile, error: upsertError } = await supabase
      .from("profiles")
      .select()
      .eq("id", user.id)
      .single();

    console.log(profile);



    if (upsertError) {
      return NextResponse.json(
        { message: "Có lỗi xảy ra khi tạo hồ sơ" },
        {
          status: 400,
          headers: {
            "Set-Cookie": `access_error=Có lỗi xảy ra khi tạo hồ sơ; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_CONFIG.maxAge}`,
          },
        }
      );
    }




    // Cache user profile (non-blocking)
    if (profile !== null) {
      redis
        .setCache(`user:${user.id}`, profile, USER_CACHE_TTL)
        .catch((err) => {
          console.error("Cache set failed:", err);
        });
    }

    if (profile.global_role !== 'admin') {
      return redirectWithCookie(
        `${origin}/login`,
        "access_error",
        "Bạn không có quyền truy cập"
      );
    }

    // Successful login - redirect to intended destination
    const redirectUrl = getRedirectUrl(origin, next, request);
    return redirectWithCookie(redirectUrl, "success", "Đăng nhập thành công");
  } catch (err) {
    return redirectWithCookie(
      `${origin}/login`,
      "access_error",
      "Có lỗi xảy ra"
    );
  }
}
