import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { type Has, createHas } from "./has";

const CONTROL_FLOW_ERROR = {
  REDIRECT_TO_SIGN_IN: "SUPABASE_PROTECT_REDIRECT_TO_SIGN_IN",
  REDIRECT_TO_URL: "SUPABASE_PROTECT_REDIRECT_TO_URL",
  FORCE_NOT_FOUND: "SUPABASE_PROTECT_FORCE_NOT_FOUND",
};

type AuthProtectOptions = {
  unauthorizedUrl?: string;
  unauthenticatedUrl?: string;
};

export interface AuthProtect {
  (params?: (has: Has) => boolean, options?: AuthProtectOptions): User;
  (options?: AuthProtectOptions): User;
}

export function handleControlFlowErrors(
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  e: any,
  request: NextRequest,
  options: { signInPath: string },
): NextResponse {
  switch (e.message) {
    case CONTROL_FLOW_ERROR.FORCE_NOT_FOUND: {
      const url = new URL(`/supabase_${Date.now()}`, request.url);
      const response = NextResponse.rewrite(url);
      response.headers.set("x-supabase-auth-reason", "protect-rewrite");
      return response;
    }
    case CONTROL_FLOW_ERROR.REDIRECT_TO_URL: {
      const url = URL.canParse(e.redirectUrl)
        ? new URL(e.redirectUrl)
        : new URL(e.redirectUrl, request.url);
      return NextResponse.redirect(url);
    }
    case CONTROL_FLOW_ERROR.REDIRECT_TO_SIGN_IN:
      return NextResponse.redirect(new URL(options.signInPath, request.url));
    default:
      throw e;
  }
}

export function createProtect(user: User | null) {
  return function protect(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    ...args: any[]
  ) {
    const hasCallback =
      typeof args[0] === "function"
        ? (args[0] as (has: Has) => boolean)
        : undefined;
    const options = (typeof args[0] === "object" ? args[0] : args[1]) as
      | AuthProtectOptions
      | undefined;

    if (!user) {
      if (options?.unauthenticatedUrl) {
        return redirect(options.unauthenticatedUrl);
      }
      return redirectToSignIn();
    }

    if (hasCallback) {
      const isAuthorized = hasCallback(createHas(user));
      if (!isAuthorized) {
        if (options?.unauthorizedUrl) {
          return redirect(options.unauthorizedUrl);
        }
        return notFound();
      }
    }

    return user;
  } as AuthProtect;
}

export function redirect(url: string) {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const err = new Error(CONTROL_FLOW_ERROR.REDIRECT_TO_URL) as any;
  err.redirectUrl = url;
  throw err;
}

export function redirectToSignIn() {
  throw new Error(CONTROL_FLOW_ERROR.REDIRECT_TO_SIGN_IN);
}

function notFound() {
  throw new Error(CONTROL_FLOW_ERROR.FORCE_NOT_FOUND);
}
