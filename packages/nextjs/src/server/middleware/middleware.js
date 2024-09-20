import { createServerClient } from "@supabase/ssr";
import { defu } from "defu";
import { NextResponse, } from "next/server";
import { createRouteMatcher } from "./create-route-matcher";
import { createHas } from "./has";
import { createProtect, handleControlFlowErrors, redirect, redirectToSignIn, } from "./protect";
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
export function supabaseMiddleware(callback, 
/**
 * Configuration options for the middleware.
 */
options) {
    const optionsWithDefaults = defu(options, {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        paths: {
            home: "/",
            signIn: "/sign-in",
            error: undefined,
            authConfirm: "/auth/confirm",
        },
    });
    const isAuthConfirmRoute = createRouteMatcher([
        `${optionsWithDefaults.paths.authConfirm}(.*)`,
    ]);
    return async function middleware(request, event) {
        let supabaseResponse = NextResponse.next({
            request,
        });
        const supabase = createServerClient(optionsWithDefaults.supabaseUrl, optionsWithDefaults.supabaseKey, {
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
        });
        if (isAuthConfirmRoute(request)) {
            const { searchParams } = new URL(request.url);
            const token_hash = searchParams.get("token_hash");
            const type = searchParams.get("type");
            const { error } = await supabase.auth.verifyOtp({
                // biome-ignore lint/style/noNonNullAssertion: we rely on verifyOtp in case of error
                type: type,
                // biome-ignore lint/style/noNonNullAssertion: we rely on verifyOtp in case of error
                token_hash: token_hash,
            });
            if (error) {
                return NextResponse.redirect(new URL(optionsWithDefaults.paths.error ?? optionsWithDefaults.paths.signIn, request.url));
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
        const { data: { user }, } = await supabase.auth.getUser();
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
        }
        catch (error) {
            return handleControlFlowErrors(error, request, {
                signInPath: optionsWithDefaults.paths.signIn,
            });
        }
        return supabaseResponse;
    };
}
//# sourceMappingURL=middleware.js.map