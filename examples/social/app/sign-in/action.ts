"use server";

import { createClient } from "@supabase-labs/nextjs/server";
import { redirect } from "next/navigation";

type FormState =
  | {
      message?: string;
    }
  | undefined;

export async function signIn(_state: FormState, _formData: FormData) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: process.env.SUPABASE_AUTH_REDIRECT_URI,
    },
  });

  if (error) {
    return {
      message: error.message,
    };
  }

  if (data.url) {
    redirect(data.url);
  }
}
