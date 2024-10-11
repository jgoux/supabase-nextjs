import type {
  CookieMethodsBrowser,
  CookieMethodsServer,
  CookieOptionsWithName,
} from "@supabase/ssr";
import type { SupabaseClientOptions } from "@supabase/supabase-js";

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

export type CreateClientOptions<
  TSchemaName,
  TCookieMethods extends CookieMethodsBrowser | CookieMethodsServer,
> = {
  supabaseUrl?: string;
  supabaseKey?: string;
} & SupabaseClientOptions<TSchemaName> & {
    cookieOptions?: CookieOptionsWithName;
    cookieEncoding?: "raw" | "base64url";
    cookies?: TCookieMethods;
  };
