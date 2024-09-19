import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType, User } from "@supabase/supabase-js";
import { defu } from "defu";
import { type NextRequest, NextResponse } from "next/server";
import { parse } from "regexparam";

/**
 * Creates a route matcher function based on an array of path patterns.
 * @param paths - An array of path patterns to match against.
 * @returns A function that tests if a given request matches any of the paths.
 * @example
 * ```ts
 * const isPublicRoute = createRouteMatcher(['/login(.*)', '/signup(.*)'])
 * ```
 */
export function createRouteMatcher(
  paths: string[],
): (request: NextRequest) => boolean {
  const regexPatterns = paths.map((path) => parse(path));
  return (request: NextRequest) =>
    regexPatterns.some(({ pattern }) => pattern.test(request.nextUrl.pathname));
}

type Auth = () => Promise<{
  /**
   * The user object if the user is authenticated, otherwise null.
   */
  user: User | null;
  /**
   * Redirects the user to the home page.
   * @returns The response to redirect to the home page.
   */
  redirectToHome: () => NextResponse;
  /**
   * Redirects the user to the sign-in page.
   * @returns The response to redirect to the sign-in page.
   */
  redirectToSignIn: () => NextResponse;
}>;

type MiddlewareOptions = {
  /**
   * The Supabase URL.
   * @default process.env.NEXT_PUBLIC_SUPABASE_URL
   */
  supabaseUrl?: string;
  /**
   * The Supabase key.
   * @default process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   */
  supabaseKey?: string;
  /**
   * Custom paths for the middleware.
   */
  paths?: {
    /**
     * The home page path.
     * @default "/"
     */
    home?: string;
    /**
     * The sign-in page path.
     * @default "/sign-in"
     */
    signIn?: string;
    /**
     * The error page path.
     */
    error?: string;
  };
};

/**
 * Middleware function for handling Supabase authentication in Next.js applications.
 * @param callback - Optional callback function to handle custom logic.
 * @param options - Configuration options for the middleware.
 * @returns Middleware function to be used in Next.js.
 * @example
 * ```ts
 * import { supabaseMiddleware, createRouteMatcher } from '@supabase/nextjs/server'
 *
 * const isPublicRoute = createRouteMatcher(['/login(.*)', '/signup(.*)'])
 *
 * export default supabaseMiddleware(
 *   async (auth, request) => {
 *     const session = await auth()
 *
 *     // protect all routes except the public ones
 *     if (!isPublicRoute(request) && !session.user) {
 *       return session.redirectToSignIn()
 *     }
 *
 *     // redirect to home if user is logged in and on public route
 *     if (isPublicRoute(request) && session.user) {
 *       return session.redirectToHome()
 *     }
 *   },
 *   {
 *     paths: {
 *       // custom signIn path
 *       signIn: '/login'
 *     }
 *   }
 * )
 * ```
 */
export function supabaseMiddleware(
  callback?: (
    /**
     * Authentication function that provides user data and redirection methods.
     * @returns Object containing user data and redirection functions.
     */
    auth: Auth,
    request: NextRequest,
    // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
  ) => Promise<void | NextResponse>,
  /**
   * Configuration options for the middleware.
   */
  options?: MiddlewareOptions,
) {
  const optionsWithDefaults = defu(options, {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    paths: {
      home: "/",
      signIn: "/sign-in",
      error: undefined,
    },
  });

  return async function middleware(request: NextRequest) {
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
      },
    );

    // If it's a server-side confirm action, handle it
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const isConfirmAction = token_hash && type;

    if (isConfirmAction) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      if (error && optionsWithDefaults.paths.error) {
        // redirect user to an error page
        return NextResponse.redirect(
          new URL(optionsWithDefaults.paths.error, request.url),
        );
      }

      const homeUrl = new URL(optionsWithDefaults.paths.home, request.url);
      homeUrl.searchParams.delete("token_hash");
      homeUrl.searchParams.delete("type");
      const redirectedResponse = NextResponse.redirect(homeUrl);
      for (const cookie of supabaseResponse.cookies.getAll()) {
        redirectedResponse.cookies.set(cookie);
      }
      return redirectedResponse;
    }

    const auth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const redirectToHome = () => {
        return NextResponse.redirect(
          new URL(optionsWithDefaults.paths.home, request.url),
        );
      };

      const redirectToSignIn = () => {
        return NextResponse.redirect(
          new URL(optionsWithDefaults.paths.signIn, request.url),
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
