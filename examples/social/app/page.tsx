import { SignOutButton } from "@/components/sign-out-button/sign-out-button";
import { createClient } from "@supabase-labs/nextjs/server";

export default async function HomePage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <div>
      Hello {data.user?.email}, you are authenticated!
      <SignOutButton />
    </div>
  );
}
