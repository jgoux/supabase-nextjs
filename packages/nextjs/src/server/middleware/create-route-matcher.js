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
export function createRouteMatcher(paths) {
    const regexPatterns = paths.map((path) => parse(path));
    return (request) => regexPatterns.some(({ pattern }) => pattern.test(request.nextUrl.pathname));
}
//# sourceMappingURL=create-route-matcher.js.map