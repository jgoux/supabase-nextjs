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

/**
 * The following types are necessary to enable Module Declaration which allows to globally type the Supabase client
 * against a generated `Database` type.
 * This trick is based on TanStack Router's implementation.
 *
 * @see https://tanstack.com/router/latest/docs/framework/react/guide/tanstack-start#the-router-configuration
 */

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface Register {
  // database: Database
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type AnyDatabase = any;

export type RegisteredDatabase = Register extends {
  database: infer TDatabase extends AnyDatabase;
}
  ? TDatabase
  : AnyDatabase;

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
  options?: {
    supabaseUrl?: string;
    supabaseKey?: string;
  } & SupabaseClientOptions<TSchemaName> & {
      cookieOptions?: CookieOptionsWithName;
      cookies?: CookieMethodsServer;
      cookieEncoding?: "raw" | "base64url";
    },
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
