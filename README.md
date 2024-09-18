# Supabase ❤️ Next.js

Use Supabase Auth in your Next.js app with ease.

## Installation

```sh
npm install @supabase/nextjs
```

## Usage

Configure Supabase using environment variables in your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL="<your-supabase-url>"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
```

Use `supabaseMiddleware` in your `middleware.ts` file:

```ts
import { supabaseMiddleware, createRouteMatcher } from '@supabase/nextjs/server'

const isPublicRoute = createRouteMatcher(['/login(.*)', '/signup(.*)'])

export default supabaseMiddleware(
  async (auth, request) => {
    const session = await auth()

    // protect all routes except the public ones
    if (!isPublicRoute(request) && !session.user) {
      return session.redirectToSignIn()
    }

    // redirect to home if user is logged in and on public route
    if (isPublicRoute(request) && session.user) {
      return session.redirectToHome()
    }
  },
  {
    paths: {
      // custom signIn path
      signIn: '/login'
    }
  }
)

export const config = {
  // don't run the middleware on static assets
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
}
```