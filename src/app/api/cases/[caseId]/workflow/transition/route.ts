import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/server/auth/session";
import { transitionCaseWorkflowStage } from "@/server/services/lifecycle-service";
import { isLifecycleStageKey } from "@/server/workflow/stage-registry";

const payloadSchema = z.object({
  stageKey: z.string().min(1),
  reason: z.string().trim().max(800).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { caseId: string } }) {
  const session = await getAuthSession();
  if (!session.userId || (session.role !== "practitioner" && session.role !== "assistant")) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const parsed = payloadSchema.parse(await request.json());
    if (!isLifecycleStageKey(parsed.stageKey)) {
      return NextResponse.json({ ok: false, error: "Invalid stage key." }, { status: 400 });
    }

    const result = await transitionCaseWorkflowStage({
      caseId: params.caseId,
      stageKey: parsed.stageKey,
      reason: parsed.reason ?? null,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: result.error === "Case not found." ? 404 : 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }
}
