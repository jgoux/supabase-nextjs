import type { User } from "@supabase/supabase-js";
export type Has = (isAuthorizedParams: Partial<User>) => boolean;
export declare function createHas(user: User | null): (userProps: Partial<User>) => boolean;
