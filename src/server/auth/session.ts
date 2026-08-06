import { cookies } from "next/headers";
import type { UserRole } from "@/types/domain";
import { isSupabaseEnabled } from "@/lib/env/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthSession {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  role: UserRole | null;
  authMode: "supabase" | "mock";
}

const MOCK_AUTH_COOKIE = "mock_auth_signed_in";
const MOCK_ROLE_COOKIE = "mock_auth_role";
const MOCK_EMAIL_COOKIE = "mock_auth_email";

export async function getAuthSession(): Promise<AuthSession> {
  if (!isSupabaseEnabled()) {
    const cookieStore = cookies();
    const signedIn = cookieStore.get(MOCK_AUTH_COOKIE)?.value === "1";
    const roleCookie = cookieStore.get(MOCK_ROLE_COOKIE)?.value;
    const role = roleCookie === "practitioner" || roleCookie === "assistant" || roleCookie === "client" ? roleCookie : "practitioner";

    // Preserve Phase 1-4 navigation behavior by allowing unsigned mock browsing,
    // while still enabling mock auth flows from login.
    return {
      isAuthenticated: signedIn || true,
      userId: signedIn ? "mock-user" : null,
      email: cookieStore.get(MOCK_EMAIL_COOKIE)?.value ?? null,
      role,
      authMode: "mock",
    };
  }

  const client = getSupabaseServerClient();
  if (!client) {
    return {
      isAuthenticated: false,
      userId: null,
      email: null,
      role: null,
      authMode: "supabase",
    };
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return {
      isAuthenticated: false,
      userId: null,
      email: null,
      role: null,
      authMode: "supabase",
    };
  }

  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role === "practitioner" || profile?.role === "assistant" || profile?.role === "client" ? profile.role : null;

  return {
    isAuthenticated: true,
    userId: user.id,
    email: user.email ?? null,
    role,
    authMode: "supabase",
  };
}

export function setMockAuthCookies(email: string, role: UserRole = "practitioner") {
  const cookieStore = cookies();
  cookieStore.set(MOCK_AUTH_COOKIE, "1", { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  cookieStore.set(MOCK_ROLE_COOKIE, role, { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  cookieStore.set(MOCK_EMAIL_COOKIE, email, { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
}

export function clearMockAuthCookies() {
  const cookieStore = cookies();
  cookieStore.set(MOCK_AUTH_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  cookieStore.set(MOCK_ROLE_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  cookieStore.set(MOCK_EMAIL_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
}
