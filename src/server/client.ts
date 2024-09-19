import {
  type CookieMethodsServer,
  type CookieOptionsWithName,
  createServerClient,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GenericSchema,
  SupabaseClientOptions,
} from "@supabase/supabase-js/dist/module/lib/types.js";
import { defu } from "defu";
import { cookies } from "next/headers";

export function createClient<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  Database = any,
  SchemaName extends string & keyof Database = "public" extends keyof Database
    ? "public"
    : string & keyof Database,
  Schema extends GenericSchema = Database[SchemaName] extends GenericSchema
    ? Database[SchemaName]
    : // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      any,
>(
  options?: {
    supabaseUrl?: string;
    supabaseKey?: string;
  } & SupabaseClientOptions<SchemaName> & {
      cookieOptions?: CookieOptionsWithName;
      cookies?: CookieMethodsServer;
      cookieEncoding?: "raw" | "base64url";
    },
): SupabaseClient<Database, SchemaName, Schema> {
  const cookieStore = cookies();

  const optionsWithDefaults = defu(options, {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    } as CookieMethodsServer,
  });

  return createServerClient(
    optionsWithDefaults.supabaseUrl,
    optionsWithDefaults.supabaseKey,
    optionsWithDefaults,
  );
}
