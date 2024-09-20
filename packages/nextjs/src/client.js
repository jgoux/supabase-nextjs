import { createBrowserClient, } from "@supabase/ssr";
import { defu } from "defu";
export function createClient(options) {
    const optionsWithDefaults = defu(options, {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
    return createBrowserClient(optionsWithDefaults.supabaseUrl, optionsWithDefaults.supabaseKey, options);
}
//# sourceMappingURL=client.js.map