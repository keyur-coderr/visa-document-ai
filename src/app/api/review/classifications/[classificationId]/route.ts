import { NextResponse } from "next/server";
import { reviewClassification } from "@/server/services/review-service";

interface ClassificationRequestBody {
  caseId?: string;
  documentId?: string;
  action?: "approve" | "use_alternative" | "override";
  finalCategory?: string | null;
  reason?: string | null;
  reviewerNote?: string | null;
}

export async function PATCH(request: Request, { params }: { params: { classificationId: string } }) {
  try {
    const body = (await request.json()) as ClassificationRequestBody;
    if (!body.caseId || !body.documentId || !body.action) {
      return NextResponse.json({ ok: false, error: "Missing required classification review payload." }, { status: 400 });
    }

    const result = await reviewClassification({
      caseId: body.caseId,
      documentId: body.documentId,
      classificationId: params.classificationId,
      action: body.action,
      finalCategory: body.finalCategory ?? null,
      reason: body.reason ?? null,
      reviewerNote: body.reviewerNote ?? null,
    });

    if (!result.ok) {
      const status = result.error?.toLowerCase().includes("only practitioners") ? 403 : 400;
      return NextResponse.json({ ok: false, error: result.error ?? "Unable to review classification." }, { status });
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
