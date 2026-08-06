import { NextResponse } from "next/server";
import { archiveGeneratedForm } from "@/server/services/forms-service";

interface Body {
  caseId?: string;
}

export async function PATCH(request: Request, { params }: { params: { generatedFormId: string } }) {
  try {
    const body = (await request.json()) as Body;
    if (!body.caseId) return NextResponse.json({ ok: false, error: "caseId is required." }, { status: 400 });

    const result = await archiveGeneratedForm({
      caseId: body.caseId,
      generatedFormId: params.generatedFormId,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error ?? "Unable to archive generated form." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "forbidden" || message === "forbidden_practitioner") {
      return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: "Unexpected archive error." }, { status: 500 });
  }
}
