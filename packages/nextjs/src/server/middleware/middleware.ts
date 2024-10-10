import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType, User } from "@supabase/supabase-js";
import { defu } from "defu";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";

import type { NextMiddlewareResult } from "next/dist/server/web/types";
import { createRouteMatcher } from "./create-route-matcher";
import { type Has, createHas } from "./has";
import {
  type AuthProtect,
  createProtect,
  handleControlFlowErrors,
  redirect,
  redirectToSignIn,
} from "./protect";

type Auth = () => {
  /**
   * Checks if the user has the given properties.
   */
  has: Has;
  /**
   * Protects the route from unauthenticated or unauthorized access.
   */
  protect: AuthProtect;
  /**
   * Redirects the user to the sign-in page.
   */
  redirectToSignIn: () => void;
  /**
   * Redirects the user to a given url.
   */
  redirect: (url: string) => void;
  /**
   * The user object if the user is authenticated, otherwise null.
   */
  user: User | null;
};

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
     * The home path.
     * @default "/"
     */
    home?: string;
    /**
     * The sign-in path.
     * @default "/sign-in"
     */
    signIn?: string;
    /**
     * The confirm path for the email/otp authentication flow.
     * @default "/auth/confirm"
     */
    authConfirm?: string;
    /**
     * The callback path for the social login flow.
     * @default "/auth/callback"
     */
    socialLoginCallback?: string;
    /**
     * The error path.
     * @default undefined
     */
    error?: string;
  };
};

type DefaultPaths = Required<
  Omit<NonNullable<MiddlewareOptions["paths"]>, "error">
> & {
  /**
   * The error path.
   * @default undefined
   */
  error?: string;
};

/**
 * Default paths for the middleware.
 */
export const defaultPaths: DefaultPaths = {
  home: "/",
  signIn: "/sign-in",
  authConfirm: "/auth/confirm",
  socialLoginCallback: "/auth/callback",
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
    event: NextFetchEvent,
  ) => NextMiddlewareResult,
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
    paths: defaultPaths,
  });

  const isAuthConfirmRoute = createRouteMatcher([
    `${optionsWithDefaults.paths.authConfirm}(.*)`,
  ]);

  const isSocialLoginCallbackRoute = createRouteMatcher([
    `${optionsWithDefaults.paths.socialLoginCallback}(.*)`,
  ]);

  return async function middleware(
    request: NextRequest,
    event: NextFetchEvent,
  ) {
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

    if (isSocialLoginCallbackRoute(request)) {
      const { searchParams, origin } = new URL(request.url);
      const code = searchParams.get("code");
      const next = searchParams.get("next") ?? optionsWithDefaults.paths.home;
      const errorResponse = NextResponse.redirect(
        new URL(
          optionsWithDefaults.paths.error ?? optionsWithDefaults.paths.signIn,
          request.url,
        ),
      );
      if (!code) {
        return errorResponse;
      }
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return errorResponse;
      }

      const websiteURL =
        /**
         * @see https://vercel.community/t/create-a-website-url-env-variable-for-all-environments/804
         */
        process.env.NEXT_PUBLIC_WEBSITE_URL ??
        request.headers.get("x-forwarded-host") ??
        origin;

      const redirectedResponse = NextResponse.redirect(`${websiteURL}${next}`);
      for (const cookie of supabaseResponse.cookies.getAll()) {
        redirectedResponse.cookies.set(cookie);
      }

      return redirectedResponse;
    }

    if (isAuthConfirmRoute(request)) {
      const { searchParams } = new URL(request.url);
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type") as EmailOtpType | null;
      const { error } = await supabase.auth.verifyOtp({
        // biome-ignore lint/style/noNonNullAssertion: we rely on verifyOtp in case of error
        type: type!,
        // biome-ignore lint/style/noNonNullAssertion: we rely on verifyOtp in case of error
        token_hash: token_hash!,
      });
      if (error) {
        return NextResponse.redirect(
          new URL(
            optionsWithDefaults.paths.error ?? optionsWithDefaults.paths.signIn,
            request.url,
          ),
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const auth = () => {
      const protect = createProtect(user);

      return {
        has: createHas(user),
        protect,
        redirect,
        redirectToSignIn,
        user,
      };
    };

    try {
      const callbackResponse = callback?.(auth, request, event);
      if (callbackResponse) {
        return callbackResponse;
      }
    } catch (error) {
      return handleControlFlowErrors(error, request, {
        signInPath: optionsWithDefaults.paths.signIn,
      });
    }

    return supabaseResponse;
  };
}
