import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { type Has } from "./has";
type AuthProtectOptions = {
    unauthorizedUrl?: string;
    unauthenticatedUrl?: string;
};
export interface AuthProtect {
    (params?: (has: Has) => boolean, options?: AuthProtectOptions): User;
    (options?: AuthProtectOptions): User;
}
export declare function handleControlFlowErrors(e: any, request: NextRequest, options: {
    signInPath: string;
}): NextResponse;
export declare function createProtect(user: User | null): AuthProtect;
export declare function redirect(url: string): void;
export declare function redirectToSignIn(): void;
export {};
