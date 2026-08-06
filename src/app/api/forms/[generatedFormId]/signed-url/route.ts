import { NextResponse } from "next/server";
import { getGeneratedFormSignedUrl } from "@/server/services/forms-service";

export async function GET(request: Request, { params }: { params: { generatedFormId: string } }) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId") ?? "";
  if (!caseId) return NextResponse.json({ error: "caseId is required." }, { status: 400 });

  try {
    const signedUrl = await getGeneratedFormSignedUrl(caseId, params.generatedFormId);
    if (!signedUrl) return NextResponse.json({ error: "Generated form output unavailable." }, { status: 404 });
    return NextResponse.json({ signedUrl, expiresInSeconds: 120 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "forbidden" || message === "forbidden_practitioner") {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to access generated form output." }, { status: 500 });
  }
}
