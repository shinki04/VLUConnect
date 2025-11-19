import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BLANK_AVATAR, Global_Roles } from "@/types/user";
import { setCache } from "@/lib/redis/redis";

const COOKIE_CONFIG = {
  path: "/",
  httpOnly: false,
  sameSite: "lax" as const,
  maxAge: 10,
};

const VLU_EMAIL_DOMAIN = "@vanlanguni.vn";
const DEFAULT_ROLE: Global_Roles = "student";
const USER_CACHE_TTL = 3600;

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

  // Validate and sanitize redirect path
  let next = searchParams.get("next") ?? "/dashboard";
  if (!next.startsWith("/")) {
    next = "/dashboard";
  }

  // Missing code - redirect to login with error
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
      console.error("Auth exchange failed:", error);
      return redirectWithCookie(
        `${origin}/login`,
        "access_error",
        "Không tìm thấy người dùng"
      );
    }

    const user = data.user;

    // Validate VLU email domain
    if (!user.email?.endsWith(VLU_EMAIL_DOMAIN)) {
      console.warn("Non-VLU user attempted login:", user.email);

      // Delete non-VLU user (fire and forget)
      supabase.auth.admin.deleteUser(user.id).catch((err) => {
        console.error("Failed to delete non-VLU user:", err);
      });

      return redirectWithCookie(
        `${origin}/login`,
        "access_error",
        "Không thuộc VLU"
      );
    }

    // Prepare user profile data
    const fullName = user.user_metadata?.full_name || `User ${user.id}`;
    const avatarUrl = user.user_metadata?.avatar_url ?? BLANK_AVATAR;
    // Upsert user profile
    const { data: profile, error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          username: fullName,
          avatar_url: avatarUrl,
          email: user.email,
          global_role: DEFAULT_ROLE,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Profile upsert failed:", upsertError);
      return redirectWithCookie(
        `${origin}/login`,
        "access_error",
        "Có lỗi xảy ra khi tạo hồ sơ"
      );
    }

    // Cache user profile (non-blocking)
    setCache(`user:${user.id}`, profile, USER_CACHE_TTL).catch((err) => {
      console.error("Cache set failed:", err);
    });

    // Successful login - redirect to intended destination
    const redirectUrl = getRedirectUrl(origin, next, request);
    return redirectWithCookie(redirectUrl, "success", "Đăng nhập thành công");
  } catch (err) {
    console.error("Unexpected error in auth callback:", err);
    return redirectWithCookie(
      `${origin}/login`,
      "access_error",
      "Có lỗi xảy ra"
    );
  }
}
