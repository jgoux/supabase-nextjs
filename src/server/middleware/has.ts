import type { User } from "@supabase/supabase-js";

export type Has = (isAuthorizedParams: Partial<User>) => boolean;

export function createHas(user: User | null) {
  return function has(userProps: Partial<User>) {
    return partiallyMatch(userProps, user);
  };
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function partiallyMatch(partial: any, full: any): boolean {
  if (partial === full) return true;
  if (typeof partial !== "object" || partial === null || full === null)
    return false;

  if (Array.isArray(partial)) {
    return (
      Array.isArray(full) &&
      partial.every((item) => full.some((elem) => partiallyMatch(item, elem)))
    );
  }

  for (const key in partial) {
    if (!(key in full) || !partiallyMatch(partial[key], full[key])) {
      return false;
    }
  }
  return true;
}
