import type { NextRequest } from "next/server";
import { parse } from "regexparam";

/**
 * Creates a route matcher function based on an array of path patterns.
 * @param paths - An array of path patterns to match against.
 * @returns A function that tests if a given request matches any of the paths.
 * @example
 * ```ts
 * const isPublicRoute = createRouteMatcher(['/login(.*)', '/signup(.*)'])
 * ```
 */
export function createRouteMatcher(
  paths: string[],
): (request: NextRequest) => boolean {
  const regexPatterns = paths.map((path) => parse(path));
  return (request: NextRequest) =>
    regexPatterns.some(({ pattern }) => pattern.test(request.nextUrl.pathname));
}
