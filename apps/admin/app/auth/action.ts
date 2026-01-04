"use server";

import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signInWithGithub() {
  const supabase = await createClient();

  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");

  if (data.url) {
    redirect(data.url); // use the redirect API for your server framework
  }
  // redirect("/dashboard");
}

export async function signInWithAzure() {
  const supabase = await createClient();

  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: `${origin}/auth/callback`,
      scopes: "openid profile email User.Read",
    },
  });
  if (error) {
    redirect("/error");
  }
  console.log(data);
  revalidatePath("/", "layout");

  if (data.url) {
    redirect(data.url); // use the redirect API for your server framework
  }
}

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();
  if (error) {
    redirect("/error");
  }

  revalidatePath("/dashboard");

  redirect("/login");
}
