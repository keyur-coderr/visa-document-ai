import { NextResponse } from "next/server";
import { approveGeneratedForm } from "@/server/services/forms-service";

interface Body {
  caseId?: string;
  note?: string | null;
}

export async function PATCH(request: Request, { params }: { params: { generatedFormId: string } }) {
  try {
    const body = (await request.json()) as Body;
    if (!body.caseId) return NextResponse.json({ ok: false, error: "caseId is required." }, { status: 400 });

    const result = await approveGeneratedForm({
      caseId: body.caseId,
      generatedFormId: params.generatedFormId,
      note: body.note ?? null,
    });

    if (!result.ok) {
      const status = result.error?.toLowerCase().includes("forbidden") ? 403 : 400;
      return NextResponse.json({ ok: false, error: result.error ?? "Unable to approve generated form." }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "forbidden" || message === "forbidden_practitioner") {
      return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: "Unexpected form approval error." }, { status: 500 });
  }
}
