import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: { documentId: string } }) {
  const client = getSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Document access is unavailable." }, { status: 503 });

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to access this document." }, { status: 401 });

  const { data: document } = await client
    .from("documents")
    .select("storage_path")
    .eq("id", params.documentId)
    .maybeSingle();
  if (!document) return NextResponse.json({ error: "Document is unavailable." }, { status: 404 });

  const { data, error } = await client.storage.from("case-documents").createSignedUrl(document.storage_path, 120);
  if (error || !data) return NextResponse.json({ error: "Document preview is unavailable." }, { status: 500 });

  return NextResponse.json({ signedUrl: data.signedUrl, expiresInSeconds: 120 });
}
