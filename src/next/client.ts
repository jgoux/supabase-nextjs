import {
  type CookieMethodsBrowser,
  type CookieOptionsWithName,
  createBrowserClient,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GenericSchema,
  SupabaseClientOptions,
} from "@supabase/supabase-js/dist/module/lib/types.js";
import { defu } from "defu";

export function createClient<
  Database = any,
  SchemaName extends string & keyof Database = "public" extends keyof Database
    ? "public"
    : string & keyof Database,
  Schema extends GenericSchema = Database[SchemaName] extends GenericSchema
    ? Database[SchemaName]
    : any
>(
  options?: {
    supabaseUrl?: string;
    supabaseKey?: string;
  } & SupabaseClientOptions<SchemaName> & {
      cookies?: CookieMethodsBrowser;
      cookieOptions?: CookieOptionsWithName;
      cookieEncoding?: "raw" | "base64url";
      isSingleton?: boolean;
    }
): SupabaseClient<Database, SchemaName, Schema> {
  const optionsWithDefaults = defu(options, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });

  return createBrowserClient(
    optionsWithDefaults.supabaseUrl,
    optionsWithDefaults.supabaseKey,
    options
  );
}
