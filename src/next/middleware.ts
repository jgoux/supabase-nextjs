import { createServerClient } from "@supabase/ssr";
import { defu } from "defu";
import { type NextRequest, NextResponse } from "next/server.js";

export function createMiddleware(options?: {
  supabaseUrl?: string;
  supabaseKey?: string;
  loginPath?: string;
  isPublicPath?: (pathname: string) => boolean;
}) {
  const optionsWithDefaults = defu(options, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    loginPath: "/login",
    isPublicPath: (pathname: string) =>
      pathname.startsWith("/login") || pathname.startsWith("/auth"),
  });

  return async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      optionsWithDefaults.supabaseUrl,
      optionsWithDefaults.supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            supabaseResponse = NextResponse.next({
              request,
            });
            for (const { name, value, options } of cookiesToSet) {
              supabaseResponse.cookies.set(name, value, options);
            }
          },
        },
      }
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !optionsWithDefaults.isPublicPath(request.nextUrl.pathname)) {
      // no user, potentially respond by redirecting the user to the login page
      const url = request.nextUrl.clone();
      url.pathname = optionsWithDefaults.loginPath;
      return NextResponse.redirect(url);
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
  };
}
