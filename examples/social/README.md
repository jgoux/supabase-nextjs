# Social login example

This example shows how to use the `@supabase-labs/nextjs` package to sign up, sign in, and sign out users in a Next.js App Router project using social login providers like GitHub.

To run this example:

```bash
pnpm install
pnpx supabase start
pnpm -w build --filter=social
pnpm start
```

# Configuration steps used in this example

## Create a GitHub OAuth application

Create a GitHub OAuth application following our [GitHub authentication guide](https://supabase.com/docs/guides/auth/social-login/auth-github?queryGroups=environment&environment=server&queryGroups=framework&framework=nextjs#register-a-new-oauth-application-on-github).

If you are using the example as is, you can use the following values:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/auth/callback`

## Environment variables

Copy `.env.example` to `.env.local` and set the `SUPABASE_AUTH_GITHUB_CLIENT_ID` and `SUPABASE_AUTH_GITHUB_CLIENT_SECRET` environment variables with the values from your GitHub OAuth application.

## Supabase configuration

Initialize Supabase

```bash
pnpx supabase init
```

Enable the GitHub external authentication provider

```toml
# supabase/config.toml

[auth]
additional_redirect_urls = ["http://localhost:3000/auth/callback"]

[auth.external.github]
enabled = true
client_id = "env(SUPABASE_AUTH_GITHUB_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_GITHUB_SECRET)"
redirect_uri = "env(SUPABASE_AUTH_GITHUB_REDIRECT_URI)"
```

Start Supabase

```bash
npx supabase start
```

## Next.js configuration

Set the  `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variable in your `.env.local` file.

If you need to get the supabase anon key, you can get it using the following command:

```bash
npx supabase status
```

## Run the app

```bash
pnpm dev
```

