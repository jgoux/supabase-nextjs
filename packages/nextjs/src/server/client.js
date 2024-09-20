import { createServerClient, } from "@supabase/ssr";
import { defu } from "defu";
import { cookies } from "next/headers";
export function createClient(options) {
    const cookieStore = cookies();
    const optionsWithDefaults = defu(options, {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    for (const { name, value, options } of cookiesToSet) {
                        cookieStore.set(name, value, options);
                    }
                }
                catch {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
        },
    });
    return createServerClient(optionsWithDefaults.supabaseUrl, optionsWithDefaults.supabaseKey, optionsWithDefaults);
}
//# sourceMappingURL=client.js.map