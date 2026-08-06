import { NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/env/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (isSupabaseEnabled()) {
    const client = getSupabaseServerClient();
    if (client) {
      await client.auth.signOut();
    }
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set("mock_auth_signed_in", "", { maxAge: 0, path: "/" });
  response.cookies.set("mock_auth_role", "", { maxAge: 0, path: "/" });
  response.cookies.set("mock_auth_email", "", { maxAge: 0, path: "/" });

  return response;
}
