import { type CookieMethodsBrowser, type CookieOptionsWithName } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenericSchema, SupabaseClientOptions } from "@supabase/supabase-js/dist/module/lib/types.js";
/**
 * The following types are necessary to enable Module Declaration which allows to globally type the Supabase client
 * against a generated `Database` type.
 * This trick is based on TanStack Router's implementation.
 *
 * @see https://tanstack.com/router/latest/docs/framework/react/guide/tanstack-start#the-router-configuration
 */
export interface Register {
}
export type AnyDatabase = any;
export type RegisteredDatabase = Register extends {
    database: infer TDatabase extends AnyDatabase;
} ? TDatabase : AnyDatabase;
export declare function createClient<TDatabase = RegisteredDatabase, TSchemaName extends string & keyof TDatabase = "public" extends keyof TDatabase ? "public" : string & keyof TDatabase, TSchema extends GenericSchema = TDatabase[TSchemaName] extends GenericSchema ? TDatabase[TSchemaName] : any>(options?: {
    supabaseUrl?: string;
    supabaseKey?: string;
} & SupabaseClientOptions<TSchemaName> & {
    cookies?: CookieMethodsBrowser;
    cookieOptions?: CookieOptionsWithName;
    cookieEncoding?: "raw" | "base64url";
    isSingleton?: boolean;
}): SupabaseClient<TDatabase, TSchemaName, TSchema>;
