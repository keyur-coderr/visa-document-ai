import { NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/env/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json() as { caseId?: string; answers?: Record<string, string>; submit?: boolean };
  if (!body.caseId || !body.answers) return NextResponse.json({ error: "Invalid intake request." }, { status: 400 });
  if (!isSupabaseEnabled()) return NextResponse.json({ completionStatus: body.submit ? "submitted" : "in_progress" });

  const client = getSupabaseServerClient();
  const { data: userData } = await client!.auth.getUser();
  const { data: profile } = await client!.from("profiles").select("role, client_id").eq("id", userData.user?.id ?? "").maybeSingle();
  if (!profile || profile.role !== "client" || !profile.client_id) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const { data: caseRecord } = await client!.from("cases").select("id, stream_config_version").eq("id", body.caseId).eq("client_id", profile.client_id).maybeSingle();
  if (!caseRecord) return NextResponse.json({ error: "Case unavailable." }, { status: 404 });

  const completionStatus = body.submit ? "submitted" : "in_progress";
  const { error } = await client!.from("intake_responses").upsert({
    case_id: caseRecord.id,
    stream_config_version: caseRecord.stream_config_version,
    answers: body.answers,
    completion_status: completionStatus,
    submitted_at: body.submit ? new Date().toISOString() : null,
  }, { onConflict: "case_id" });
  if (error) return NextResponse.json({ error: "Unable to save your intake." }, { status: 500 });
  return NextResponse.json({ completionStatus });
}
