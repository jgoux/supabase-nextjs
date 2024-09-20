# Basic example

This example shows how to use the `@supabase-labs/nextjs` package to sign up, sign in, and sign out users in a Next.js App Router project.

To run this example:

```bash
pnpm install
pnpx supabase start
pnpm -w build --filter=basic
pnpm start
```

# Configuration steps used in this example

## Supabase configuration

Initialize Supabase

```bash
pnpx supabase init
```

Define the confirmation email template for PKCE authentication flow

```html
<!-- supabase/templates/confirmation.html -->

<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your mail</a></p>
```

Enable email signup with confirmation

```toml
# supabase/config.toml

[auth.email]
enable_signup = true
enable_confirmations = true

[auth.email.template.confirmation]
subject = "Confirm Your Signup"
content_path = "./supabase/templates/confirmation.html"
```

Start Supabase

```bash
npx supabase start
```

## Next.js configuration

Copy `.env.example` to `.env.local` and set the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables.

If you need to get the supabase url and anon key, you can get them using the following command:

```bash
npx supabase status
```

## Run the app

```bash
pnpm dev
```

