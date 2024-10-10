import {
  createRouteMatcher,
  supabaseMiddleware,
} from "@supabase-labs/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)"]);

export default supabaseMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }

  if (isPublicRoute(request) && auth().user) {
    auth().redirect("/");
  }
});

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
