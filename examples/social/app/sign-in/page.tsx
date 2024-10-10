"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "./action";

export default function SignInPage() {
  const [state, action] = useFormState(signIn, undefined);
  const { pending } = useFormStatus();

  return (
    <form action={action}>
      {state?.message && <p>{state.message}</p>}
      <button type="submit" disabled={pending}>
        Sign In with GitHub
      </button>
    </form>
  );
}
