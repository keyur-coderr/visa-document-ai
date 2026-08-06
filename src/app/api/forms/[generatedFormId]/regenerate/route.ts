import { NextResponse } from "next/server";
import { regenerateGeneratedForm } from "@/server/services/forms-service";

interface Body {
  caseId?: string;
  reason?: string;
}

export async function POST(request: Request, { params }: { params: { generatedFormId: string } }) {
  try {
    const body = (await request.json()) as Body;
    if (!body.caseId || !body.reason?.trim()) {
      return NextResponse.json({ ok: false, error: "caseId and regeneration reason are required." }, { status: 400 });
    }

    const result = await regenerateGeneratedForm({
      caseId: body.caseId,
      generatedFormId: params.generatedFormId,
      reason: body.reason.trim(),
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error ?? "Unable to regenerate form." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, generatedFormId: result.generatedFormId, generatedFormVersionId: result.generatedFormVersionId, status: result.status }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "forbidden" || message === "forbidden_practitioner") {
      return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: "Unexpected regeneration error." }, { status: 500 });
  }
}
