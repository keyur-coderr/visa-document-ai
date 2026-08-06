"use server";

import { redirect } from "next/navigation";
import { safeLog } from "@/lib/security/safe-logger";
import { isSupabaseEnabled } from "@/lib/env/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { clearMockAuthCookies, setMockAuthCookies } from "@/server/auth/session";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function assertValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function assertPassword(password: string): boolean {
  return password.length >= 8;
}

export async function signInWithPasswordAction(formData: FormData) {
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");

  if (!assertValidEmail(email) || !assertPassword(password)) {
    redirect("/login?error=invalid_credentials");
  }

  if (!isSupabaseEnabled()) {
    setMockAuthCookies(email, "practitioner");
    redirect("/dashboard");
  }

  const client = getSupabaseServerClient();
  if (!client) {
    redirect("/login?error=supabase_not_configured");
  }

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    safeLog("auth_signin_failed", { reason: error.message, mode: "supabase" });
    redirect("/login?error=signin_failed");
  }

  redirect("/dashboard");
}

export async function signInWithMagicLinkAction(formData: FormData) {
  const email = readString(formData, "email").toLowerCase();
  if (!assertValidEmail(email)) {
    redirect("/login?error=invalid_email");
  }

  if (!isSupabaseEnabled()) {
    setMockAuthCookies(email, "practitioner");
    redirect("/dashboard");
  }

  const client = getSupabaseServerClient();
  if (!client) {
    redirect("/login?error=supabase_not_configured");
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    safeLog("auth_magic_link_failed", { reason: error.message, mode: "supabase" });
    redirect("/login?error=magic_link_failed");
  }

  redirect("/login?status=magic_link_sent");
}

export async function signUpPractitionerAction(formData: FormData) {
  const fullName = readString(formData, "fullName");
  const firmName = readString(formData, "firmName");
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");

  if (!fullName || !firmName || !assertValidEmail(email) || !assertPassword(password)) {
    redirect("/signup?error=invalid_signup_input");
  }

  if (!isSupabaseEnabled()) {
    setMockAuthCookies(email, "practitioner");
    redirect("/dashboard");
  }

  const client = getSupabaseServerClient();
  if (!client) {
    redirect("/signup?error=supabase_not_configured");
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        firm_name: firmName,
        role: "practitioner",
      },
    },
  });

  if (error || !data.user) {
    safeLog("auth_signup_failed", { reason: error?.message ?? "unknown", mode: "supabase" });
    redirect("/signup?error=signup_failed");
  }

  await client.from("profiles").upsert({
    id: data.user.id,
    email,
    full_name: fullName,
    role: "practitioner",
  });

  redirect("/session");
}

export async function sendPasswordResetAction(formData: FormData) {
  const email = readString(formData, "email").toLowerCase();
  if (!assertValidEmail(email)) {
    redirect("/forgot-password?error=invalid_email");
  }

  if (!isSupabaseEnabled()) {
    redirect("/forgot-password?status=reset_link_sent");
  }

  const client = getSupabaseServerClient();
  if (!client) {
    redirect("/forgot-password?error=supabase_not_configured");
  }

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/reset-password`,
  });

  if (error) {
    safeLog("auth_reset_link_failed", { reason: error.message, mode: "supabase" });
    redirect("/forgot-password?error=reset_link_failed");
  }

  redirect("/forgot-password?status=reset_link_sent");
}

export async function resetPasswordAction(formData: FormData) {
  const password = readString(formData, "password");
  const confirm = readString(formData, "confirmPassword");

  if (!assertPassword(password) || password !== confirm) {
    redirect("/reset-password?error=password_mismatch");
  }

  if (!isSupabaseEnabled()) {
    redirect("/login?status=password_reset_mock");
  }

  const client = getSupabaseServerClient();
  if (!client) {
    redirect("/reset-password?error=supabase_not_configured");
  }

  const { error } = await client.auth.updateUser({ password });
  if (error) {
    safeLog("auth_password_reset_failed", { reason: error.message, mode: "supabase" });
    redirect("/reset-password?error=password_reset_failed");
  }

  redirect("/login?status=password_reset_success");
}

export async function signOutAction() {
  if (!isSupabaseEnabled()) {
    clearMockAuthCookies();
    redirect("/login");
  }

  const client = getSupabaseServerClient();
  if (client) {
    await client.auth.signOut();
  }

  redirect("/login");
}
