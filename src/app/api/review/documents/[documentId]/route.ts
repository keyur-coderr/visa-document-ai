import { NextResponse } from "next/server";
import { reviewDocumentAction } from "@/server/services/review-service";

interface DocumentRequestBody {
  caseId?: string;
  action?: "mark_reviewed" | "approve_document" | "reject_document" | "request_reupload" | "mark_ready_for_practitioner";
  reuploadReason?: string | null;
  internalNote?: string | null;
}

export async function PATCH(request: Request, { params }: { params: { documentId: string } }) {
  try {
    const body = (await request.json()) as DocumentRequestBody;
    if (!body.caseId || !body.action) {
      return NextResponse.json({ ok: false, error: "Missing required document review payload." }, { status: 400 });
    }

    const result = await reviewDocumentAction({
      caseId: body.caseId,
      documentId: params.documentId,
      action: body.action,
      reuploadReason: body.reuploadReason ?? null,
      internalNote: body.internalNote ?? null,
    });

    if (!result.ok) {
      const status = result.error?.toLowerCase().includes("only practitioners") ? 403 : 400;
      return NextResponse.json({ ok: false, error: result.error ?? "Unable to update document review state." }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "forbidden") {
      return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: "Unexpected review error." }, { status: 500 });
  }
}
