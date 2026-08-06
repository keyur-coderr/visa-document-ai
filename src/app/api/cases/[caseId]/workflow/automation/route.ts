import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/server/auth/session";
import { triggerWorkflowAutomation } from "@/server/services/lifecycle-service";

const payloadSchema = z.object({
  eventKey: z.string().trim().min(1).max(120),
  context: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request, { params }: { params: { caseId: string } }) {
  const session = await getAuthSession();
  if (!session.userId || (session.role !== "practitioner" && session.role !== "assistant")) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const parsed = payloadSchema.parse(await request.json());
    const result = await triggerWorkflowAutomation({
      caseId: params.caseId,
      eventKey: parsed.eventKey,
      context: parsed.context ?? {},
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }
}
