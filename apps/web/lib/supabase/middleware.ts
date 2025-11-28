import { Database } from "@/types/database.types";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const publicPaths = ["/", "/login", "/auth/callback"];

  // Nếu request nằm trong public path → bỏ qua check user
  const isPublic = publicPaths.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith(path + "/")
  );

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: Don't remove getClaims()
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  if (!user && !isPublic) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";

    const res = NextResponse.redirect(url);
    res.cookies.set("access_error", "Bạn không có quyền truy cập", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 10,
    });
    return res;
  }

  // Check role admin nếu truy cập /admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const role = user?.app_metadata?.global_role; // custom claims
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard"; // redirect nếu không phải admin
      const res = NextResponse.redirect(url);

      // Set cookie tạm để gửi message
      res.cookies.set("access_error", "Bạn không có quyền truy cập", {
        path: "/",
        httpOnly: false, // client đọc được
        sameSite: "lax",
        maxAge: 10, // 10 giây là đủ
      });
      return res;
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
