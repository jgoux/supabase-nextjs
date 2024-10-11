import { type CookieMethodsBrowser, createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenericSchema } from "@supabase/supabase-js/dist/module/lib/types.js";
import { defu } from "defu";
import type { CreateClientOptions, RegisteredDatabase } from "./types";

export type { Register } from "./types";

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
  options?: CreateClientOptions<TSchemaName, CookieMethodsBrowser> & {
    isSingleton?: boolean;
  },
): SupabaseClient<TDatabase, TSchemaName, TSchema> {
  const optionsWithDefaults = defu(options, {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });

  return createBrowserClient(
    optionsWithDefaults.supabaseUrl,
    optionsWithDefaults.supabaseKey,
    options,
  );
}
