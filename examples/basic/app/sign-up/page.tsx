"use client";

import { signUp } from "@/app/actions/auth/sign-up";
import { useFormState, useFormStatus } from "react-dom";

export default function SignUpPage() {
  const [state, action] = useFormState(signUp, undefined);

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
        {state?.errors?.password && (
          <div>
            <p>Password must:</p>
            <ul>
              {state.errors.password.map((error) => (
                <li key={error}>- {error}</li>
              ))}
            </ul>
          </div>
        )}

        <SubmitButton />
      </form>
      <span>
        Already have an account? <a href="/sign-in">Sign In</a>
      </span>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} type="submit">
      Sign Up
    </button>
  );
}
