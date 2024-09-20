import { createClient } from "@supabase-labs/nextjs/server";
import { signOut } from "./actions/auth/sign-out";

export default async function HomePage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();

  return (
    <div>
      Hello {data.session?.user.email}, you are authenticated!
      <form action={signOut}>
        <button type="submit">Sign Out</button>
      </form>
    </div>
  );
}
