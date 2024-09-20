import type { NextRequest } from "next/server";
/**
 * Creates a route matcher function based on an array of path patterns.
 * @param paths - An array of path patterns to match against.
 * @returns A function that tests if a given request matches any of the paths.
 * @example
 * ```ts
 * const isPublicRoute = createRouteMatcher(['/login(.*)', '/signup(.*)'])
 * ```
 */
export declare function createRouteMatcher(paths: string[]): (request: NextRequest) => boolean;
