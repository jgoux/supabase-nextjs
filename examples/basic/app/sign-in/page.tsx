"use client";

import { signIn } from "@/app/actions/auth/sign-in";
import { useFormState, useFormStatus } from "react-dom";

export default function SignInPage() {
  const [state, action] = useFormState(signIn, undefined);

  return (
    <>
      <form action={action}>
        {state?.message && <p>{state.message}</p>}

        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" placeholder="Email" />
        </div>
        {state?.errors?.email && <p>{state.errors.email}</p>}

        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" />
        </div>

        <SubmitButton />
      </form>
      <span>
        Don't have an account? <a href="/sign-up">Sign Up</a>
      </span>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} type="submit">
      Sign In
    </button>
  );
}
