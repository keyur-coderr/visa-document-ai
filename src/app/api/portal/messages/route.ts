import { NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/env/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json() as { caseId?: string; message?: string };
  const message = body.message?.trim();
  if (!body.caseId || !message || message.length > 2000) return NextResponse.json({ error: "Enter a message of up to 2,000 characters." }, { status: 400 });
  if (!isSupabaseEnabled()) return NextResponse.json({ id: "mock-message", createdAt: new Date().toISOString() }, { status: 201 });

  const client = getSupabaseServerClient();
  const { data: userData } = await client!.auth.getUser();
  const { data: profile } = await client!.from("profiles").select("id, role, client_id").eq("id", userData.user?.id ?? "").maybeSingle();
  if (!profile || profile.role !== "client" || !profile.client_id) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const { data: caseRecord } = await client!.from("cases").select("id, firm_id").eq("id", body.caseId).eq("client_id", profile.client_id).maybeSingle();
  if (!caseRecord) return NextResponse.json({ error: "Case unavailable." }, { status: 404 });
  const { data, error } = await client!.from("case_messages").insert({ firm_id: caseRecord.firm_id, case_id: caseRecord.id, sender_id: profile.id, sender_role: "client", body: message }).select("id, created_at").single();
  if (error) return NextResponse.json({ error: "Unable to send your message." }, { status: 500 });
  return NextResponse.json({ id: data.id, createdAt: data.created_at }, { status: 201 });
}
