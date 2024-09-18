import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType, User } from "@supabase/supabase-js";
import { defu } from "defu";
import { type NextRequest, NextResponse } from "next/server";
import { parse } from "regexparam";
import { createClient } from "./client.js";

export function createRouteMatcher(paths: string[]) {
  const regexPatterns = paths.map((path) => parse(path));
  return (request: NextRequest) =>
    regexPatterns.some(({ pattern }) => pattern.test(request.nextUrl.pathname));
}

export function supabaseMiddleware(
  callback?: (
    auth: () => Promise<{
      user: User | null;
      redirectToHome: () => NextResponse;
      redirectToSignIn: () => NextResponse;
    }>,
    request: NextRequest
    // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
  ) => Promise<void | NextResponse>,
  options?: {
    supabaseUrl?: string;
    supabaseKey?: string;
    paths?: {
      home?: string;
      signIn?: string;
    };
  }
) {
  const optionsWithDefaults = defu(options, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    paths: {
      home: "/",
      signIn: "/sign-in",
      error: "/error",
    },
  });

  return async function middleware(request: NextRequest) {
    // If it's a server-side confirm action, handle it
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const isConfirmAction = token_hash && type;
    if (isConfirmAction) {
      const next = new URL(
        searchParams.get("next") ?? optionsWithDefaults.paths.home,
        request.url
      );
      next.searchParams.delete("token_hash");
      next.searchParams.delete("type");
      let supabaseResponse = NextResponse.redirect(next);
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
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      if (error) {
        // redirect user to an error page
        return NextResponse.redirect(
          new URL(optionsWithDefaults.paths.error, request.url)
        );
      }
      return supabaseResponse;
    }

    // At this point, we know it's not a confirm action, so we can proceed with the middleware
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

    const auth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const redirectToHome = () => {
        return NextResponse.redirect(
          new URL(optionsWithDefaults.paths.home, request.url)
        );
      };

      const redirectToSignIn = () => {
        return NextResponse.redirect(
          new URL(optionsWithDefaults.paths.signIn, request.url)
        );
      };

      return {
        user,
        redirectToSignIn,
        redirectToHome,
      };
    };

    const callbackResponse = await callback?.(auth, request);

    if (callbackResponse) {
      return callbackResponse;
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
