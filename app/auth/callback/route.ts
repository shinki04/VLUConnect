import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  console.log(`Code là ${code}`);
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
      return NextResponse.redirect(`${origin}/login?error=user_not_found`);
    }

    //todo Chỗ này xử lý logic sau
    if (!user?.email?.endsWith("@vanlanguni.vn")) {
      console.warn("Khong phai VLU");
      // Xoá user ngay sau khi tạo
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      console.warn("Deleted non-vanlang user:", error);
      return NextResponse.redirect(`${origin}/login?error=invalid_domain`);
    }

    // ---- Xử lý sau khi login thành công ----

    console.log("La VLU");
    console.log("USER NE", user);
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      `User ${user.id}`;
    const avatarUrl = user.user_metadata?.avatar_url ?? null;

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: fullName, avatar_url: avatarUrl });

    if (!error && !upsertError) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}?success=login`);
      } else if (forwardedHost) {
        return NextResponse.redirect(
          `https://${forwardedHost}${next}?success=login`
        );
      } else {
        return NextResponse.redirect(`${origin}${next}?success=login`);
      }
    } else {
      console.error(error, upsertError);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
