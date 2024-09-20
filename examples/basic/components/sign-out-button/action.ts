"use server";

import { createClient } from "@supabase-labs/nextjs/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
