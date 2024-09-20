import type { User } from "@supabase/supabase-js";
import { type NextFetchEvent, type NextRequest } from "next/server";
import type { NextMiddlewareResult } from "next/dist/server/web/types";
import { type Has } from "./has";
import { type AuthProtect } from "./protect";
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
         * The sign-in path.
         * @default "/sign-in"
         */
        signIn?: string;
        /**
         * The auth confirm path.
         * @default "/auth/confirm"
         */
        authConfirm?: string;
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
export declare function supabaseMiddleware(callback?: (
/**
 * Authentication function that provides user data and redirection methods.
 * @returns Object containing user data and redirection functions.
 */
auth: Auth, request: NextRequest, event: NextFetchEvent) => NextMiddlewareResult, 
/**
 * Configuration options for the middleware.
 */
options?: MiddlewareOptions): (request: NextRequest, event: NextFetchEvent) => Promise<Response>;
export {};
