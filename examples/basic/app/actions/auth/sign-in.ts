"use server";

import { createClient } from "@supabase-labs/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const SignInFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }).trim(),
  password: z.string().trim(),
});

type FormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export async function signIn(state: FormState, formData: FormData) {
  // Validate form fields
  const validatedFields = SignInFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Create a new user on Supabase
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
  });

  // If there's an error creating the user, return an error message
  if (error) {
    return {
      message: error.message,
    };
  }

  // Redirect the user to the home page
  redirect("/");
}
