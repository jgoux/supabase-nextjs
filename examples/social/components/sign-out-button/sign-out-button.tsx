import { signOut } from "./action";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit">Sign Out</button>
    </form>
  );
}
