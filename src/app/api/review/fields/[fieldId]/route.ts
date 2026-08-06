import { NextResponse } from "next/server";
import { reviewExtractionField, saveFieldReviewDraft } from "@/server/services/review-service";

interface FieldRequestBody {
  caseId?: string;
  documentId?: string;
  mode?: "draft" | "review";
  draftValue?: string | null;
  reviewerNote?: string | null;
  unsavedChanges?: boolean;
  action?: "approve" | "reject" | "override" | "clarification" | "restore";
  editedValue?: string | null;
  reason?: string | null;
}

export async function PATCH(request: Request, { params }: { params: { fieldId: string } }) {
  try {
    const body = (await request.json()) as FieldRequestBody;

    if (!body.caseId || !body.documentId || !body.mode) {
      return NextResponse.json({ ok: false, error: "Missing required review payload." }, { status: 400 });
    }

    if (body.mode === "draft") {
      const result = await saveFieldReviewDraft({
        caseId: body.caseId,
        documentId: body.documentId,
        fieldId: params.fieldId,
        draftValue: body.draftValue ?? null,
        reviewerNote: body.reviewerNote ?? null,
        unsavedChanges: Boolean(body.unsavedChanges),
      });
      if (!result.ok) return NextResponse.json({ ok: false, error: "Unable to save draft." }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (!body.action) {
      return NextResponse.json({ ok: false, error: "Field review action is required." }, { status: 400 });
    }

    const result = await reviewExtractionField({
      caseId: body.caseId,
      documentId: body.documentId,
      fieldId: params.fieldId,
      action: body.action,
      editedValue: body.editedValue ?? null,
      reason: body.reason ?? null,
      reviewerNote: body.reviewerNote ?? null,
    });

    if (!result.ok) {
      const status = result.error?.toLowerCase().includes("only practitioners") ? 403 : 400;
      return NextResponse.json({ ok: false, error: result.error ?? "Unable to complete field review action." }, { status });
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
