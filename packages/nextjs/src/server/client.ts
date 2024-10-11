import { type CookieMethodsServer, createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenericSchema } from "@supabase/supabase-js/dist/module/lib/types.js";
import { defu } from "defu";
import { cookies } from "next/headers";
import type { CreateClientOptions, RegisteredDatabase } from "../types";

export type { Register } from "../types";

export function createClient<
  TDatabase = RegisteredDatabase,
  TSchemaName extends string &
    keyof TDatabase = "public" extends keyof TDatabase
    ? "public"
    : string & keyof TDatabase,
  TSchema extends GenericSchema = TDatabase[TSchemaName] extends GenericSchema
    ? TDatabase[TSchemaName]
    : // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      any,
>(
  options?: CreateClientOptions<TSchemaName, CookieMethodsServer>,
): SupabaseClient<TDatabase, TSchemaName, TSchema> {
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
