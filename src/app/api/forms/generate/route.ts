import { NextResponse } from "next/server";
import { generateCaseForm } from "@/server/services/forms-service";

interface Body {
  caseId?: string;
  formCode?: "IMM 0008" | "IMM 5669" | "IMM 5406" | "IMM 5476";
  reason?: string | null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    if (!body.caseId || !body.formCode) {
      return NextResponse.json({ ok: false, error: "caseId and formCode are required." }, { status: 400 });
    }

    const result = await generateCaseForm({
      caseId: body.caseId,
      formCode: body.formCode,
      regenerationReason: body.reason ?? null,
    });

    if (!result.ok) {
      const error = "error" in result ? result.error : "Generation failed.";
      const status = error?.toLowerCase().includes("forbidden") ? 403 : 400;
      return NextResponse.json({ ok: false, error }, { status });
    }

    return NextResponse.json({ ok: true, generatedFormId: result.generatedFormId, generatedFormVersionId: result.generatedFormVersionId, status: result.status }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "forbidden") return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
    return NextResponse.json({ ok: false, error: "Unexpected form generation error." }, { status: 500 });
  }
}
