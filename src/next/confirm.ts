import type { EmailOtpType } from "@supabase/supabase-js";
import { defu } from "defu";
import { redirect } from "next/navigation.js";
import type { NextRequest } from "next/server.js";
import { createClient } from "./server.js";

export function createConfirmRoute(options?: {
  createClient?: typeof createClient;
  rootPath?: string;
  errorPath?: string;
}) {
  const optionsWithDefaults = defu(options, {
    createClient,
    rootPath: "/",
    errorPath: "/error",
  });

  return async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = searchParams.get("next") ?? optionsWithDefaults.rootPath;

    if (token_hash && type) {
      const supabase = createClient();

      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      if (!error) {
        // redirect user to specified redirect URL or root of app
        redirect(next);
      }
    }

    // redirect the user to an error page with some instructions
    redirect(optionsWithDefaults.errorPath);
  };
}
