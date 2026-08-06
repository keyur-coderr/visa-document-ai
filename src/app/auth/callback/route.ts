import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const client = getSupabaseServerClient();
  if (!client || !code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  await client.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(`${origin}${next}`);
}
